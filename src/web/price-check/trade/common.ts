import { StatFilter } from '../filters/interfaces'
import { TRADE_TAG_BY_NAME } from '@/assets/data'
import { Config } from '@/web/Config'
import { RateLimiter } from './RateLimiter'
import { ParsedItem, ItemCategory, ItemRarity } from '@/parser'

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

export function apiToSatisfySearch (item: ParsedItem, stats: StatFilter[]): 'trade' | 'bulk' {
  if (stats.some(s => s.disabled === false)) {
    return 'trade'
  }

  return tradeTag(item) != null ? 'bulk' : 'trade'
}

export function tradeTag (item: ParsedItem): string | undefined {
  if (
    item.category === ItemCategory.Map &&
    item.rarity === ItemRarity.Unique
  ) return

  let name = item.baseType || item.name
  if (name) {
    if (item.props.mapBlighted) {
      name = `Blighted ${name}`
    } else if (item.props.mapTier) {
      name = `${name} (Tier ${item.props.mapTier})`
    }

    return TRADE_TAG_BY_NAME.get(name)
  }
}

const ENDPOINT_BY_LANG = {
  en: 'www.pathofexile.com',
  ru: 'ru.pathofexile.com'
}

export function getTradeEndpoint () {
  return ENDPOINT_BY_LANG[Config.store.language]
}

export const RATE_LIMIT_RULES = {
  SEARCH: [
    new RateLimiter(8, 6),
    new RateLimiter(12, 30),
    new RateLimiter(15, 60)
  ],
  FETCH: [
    new RateLimiter(4, 4),
    new RateLimiter(8, 12),
    new RateLimiter(10, 30)
  ]
}

export function adjustRateLimits (clientLimits: RateLimiter[], headers: Headers) {
  if (!headers.has('x-rate-limit-rules')) return clientLimits

  const rules = headers.get('x-rate-limit-rules')!.split(',')

  return _adjustRateLimits(
    clientLimits,
    rules.map(rule => headers.get(`x-rate-limit-${rule}`)!).join(','),
    rules.map(rule => headers.get(`x-rate-limit-${rule}-state`)!).join(',')
  )
}

function _adjustRateLimits (clientLimits: RateLimiter[], limitStr: string, stateStr: string) { /* eslint-disable no-console */
  const DEBUG = true
  const DESYNC_FIX = 1

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
      limit.destroy()
      DEBUG && console.log('Destroy', limit.toString())
    }
  }

  // filter active
  clientLimits = clientLimits.filter(limit =>
    limitRule.some(serverLimit => limit.isEqualLimit(serverLimit))
  )

  // compare client<>server state
  for (const limit of clientLimits) {
    const serverLimit = limitRule.find(serverLimit => limit.isEqualLimit(serverLimit))!
    const delta = (serverLimit.state - limit.state.stack.length)

    if (delta === 0) {
      DEBUG && console.log('Limits are in sync')
    } else if (delta > 0) {
      DEBUG && console.error(`Rate limit state on Server is greater by ${Math.abs(delta)}. Bursting to prevent rate limiting.`)
      limit.forceSmallWait()
    } else if (delta < 0) {
      DEBUG && console.warn(`Rate limit state on Client is greater by ${Math.abs(delta)}`)
    }
  }

  // add new
  for (const serverLimit of limitRule) {
    if (clientLimits.some(limit => limit.isEqualLimit(serverLimit))) continue

    const rl = new RateLimiter(serverLimit.max, serverLimit.window)
    clientLimits.push(rl)
    DEBUG && console.log('Add', rl.toString())

    Array(serverLimit.state).fill(undefined).forEach(() => {
      rl.wait()
    })
  }

  return clientLimits
}
