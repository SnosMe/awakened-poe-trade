import { ItemFilters, StatFilter } from '../filters/interfaces'
import { TRADE_TAG_BY_NAME } from '@/assets/data'
import { Config } from '@/web/Config'
import { RateLimiter } from './RateLimiter'
import { ParsedItem, ItemCategory, ItemRarity } from '@/parser'
import { PriceCheckWidget } from '@/web/overlay/interfaces'
import { shallowReactive } from 'vue'

export interface Account {
  name: string
  lastCharacterName: string
  online?: {
    status?: 'afk'
  }
}

export interface SearchResult {
  id: string
  result: string[]
  total: number
  inexact?: boolean
  error?: {
    code: number
    message: string
  }
}

export function apiToSatisfySearch (item: ParsedItem, stats: StatFilter[], filters: ItemFilters): 'trade' | 'bulk' {
  if (stats.some(s => !s.disabled)) {
    return 'trade'
  }

  if (filters.stackSize) {
    if (
      item.rarity === ItemRarity.DivinationCard ||
      item.category === ItemCategory.Prophecy ||
      item.category === ItemCategory.MavenInvitation ||
      item.category === ItemCategory.Map
    ) {
      return filters.stackSize.disabled ? 'trade' : 'bulk'
    }
  }

  return tradeTag(item) != null ? 'bulk' : 'trade'
}

export function tradeTag (item: ParsedItem): string | undefined {
  let name = item.baseType || item.name
  if (item.category === ItemCategory.Map && item.rarity === ItemRarity.Unique) {
    name = item.name
  }

  if (name) {
    if (item.props.mapBlighted) {
      name = `Blighted ${name} (Tier ${item.props.mapTier})`
    } else if (item.props.mapTier) {
      name = `${name} (Tier ${item.props.mapTier})`
    } else if (item.extra.prophecyMaster) {
      name = `${name} (${item.extra.prophecyMaster})`
    }

    return TRADE_TAG_BY_NAME.get(name)
  }
}

const ENDPOINT_BY_LANG = {
  en: 'www.pathofexile.com',
  ru: 'ru.pathofexile.com'
}

export function getTradeEndpoint (): string {
  return ENDPOINT_BY_LANG[Config.store.language]
}

export const RATE_LIMIT_RULES = {
  SEARCH: shallowReactive(new Set([
    new RateLimiter(1, 5)
  ])),
  EXCHANGE: shallowReactive(new Set([
    new RateLimiter(1, 5)
  ])),
  FETCH: shallowReactive(new Set([
    new RateLimiter(1, 5)
  ]))
}

export function adjustRateLimits (clientLimits: Set<RateLimiter>, headers: Headers): void {
  if (!headers.has('x-rate-limit-rules')) return

  const rules = headers.get('x-rate-limit-rules')!.split(',')

  _adjustRateLimits(
    clientLimits,
    rules.map(rule => headers.get(`x-rate-limit-${rule}`)!).join(','),
    rules.map(rule => headers.get(`x-rate-limit-${rule}-state`)!).join(',')
  )
}

function _adjustRateLimits (clientLimits: Set<RateLimiter>, limitStr: string, stateStr: string): void { /* eslint-disable no-console */
  const DEBUG = false
  const DESYNC_FIX = (Config.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget).apiLatencySeconds

  const limitRuleState = stateStr
    .split(',')
    .map(rule => rule.split(':'))
    .map(rule => Number(rule[0]))
  const limitRule = limitStr
    .split(',')
    .map(rule => rule.split(':'))
    .map((rule, idx) => ({
      max: Number(rule[0]),
      window: Number(rule[1]) + DESYNC_FIX,
      state: limitRuleState[idx]
    }))

  // destroy
  for (const limit of clientLimits) {
    const isActive = limitRule.some(serverLimit => limit.isEqualLimit(serverLimit))
    if (!isActive) {
      clientLimits.delete(limit)
      limit.destroy()
      DEBUG && console.log('Destroy', limit.toString())
    }
  }

  // compare client<>server state
  for (const limit of clientLimits) {
    const serverLimit = limitRule.find(serverLimit => limit.isEqualLimit(serverLimit))!
    const delta = (serverLimit.state - limit.stack.length)

    if (delta === 0) {
      DEBUG && console.log('Limits are in sync')
    } else if (delta > 0) {
      DEBUG && console.error(`Rate limit state on Server is greater by ${Math.abs(delta)}. Bursting to prevent rate limiting.`)
      for (let i = 0; i < Math.min(delta, limit.available); ++i) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        limit.wait()
      }
    } else if (delta < 0) {
      DEBUG && console.warn(`Rate limit state on Client is greater by ${Math.abs(delta)}`)
    }
  }

  // add new
  serverLimits:
  for (const serverLimit of limitRule) {
    for (const limit of clientLimits) {
      if (limit.isEqualLimit(serverLimit)) continue serverLimits
    }

    const rl = new RateLimiter(serverLimit.max, serverLimit.window)
    clientLimits.add(rl)
    DEBUG && console.log('Add', rl.toString())

    for (let i = 0; i < serverLimit.state; ++i) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      rl.wait()
    }
  }
}

export function preventQueueCreation (targets: Array<{ count: number, limiters: Iterable<RateLimiter> }>) {
  const estimatedMillis = Math.max(...targets.map(target => {
    const estimated = RateLimiter.estimateTime(target.count, target.limiters)
    const estimatedCleanState = RateLimiter.estimateTime(target.count, target.limiters, true)

    // ignore if impossible to run without queue
    return (estimated === estimatedCleanState) ? 0 : estimated
  }))

  if (estimatedMillis >= 1500) {
    throw new Error(`Retry after ${Math.round(estimatedMillis / 1000)} seconds`)
  }
}
