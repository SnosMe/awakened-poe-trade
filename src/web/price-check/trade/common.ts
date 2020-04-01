import { ItemFilters, StatFilter } from '../filters/interfaces'
import { TRADE_TAG_BY_NAME } from '@/assets/data'
import { Config } from '@/web/Config'
import { RateLimiter } from './RateLimiter'

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

export function apiToSatisfySearch (filters: ItemFilters, stats: StatFilter[]): 'trade' | 'bulk' {
  if (stats.some(s => s.disabled === false)) {
    return 'trade'
  }

  return tradeTag(filters) != null ? 'bulk' : 'trade'
}

export function tradeTag (filters: ItemFilters): string | undefined {
  if (
    filters.mapTier &&
    (filters.baseType && filters.name) // unique map
  ) return

  let name = filters.baseType?.value || filters.name?.value
  if (name) {
    if (filters.mapBlighted) {
      name = `Blighted ${name}`
    } else if (filters.mapTier) {
      name = `${name} (Tier ${filters.mapTier.value})`
    }

    return TRADE_TAG_BY_NAME.get(name)
  }
}

const SUBDOMAIN_ENDPOINT = {
  us: 'www.pathofexile.com',
  th: 'th.pathofexile.com',
  kr: 'poe.game.daum.net'
}

export function getTradeEndpoint () {
  return SUBDOMAIN_ENDPOINT[Config.store.subdomain as keyof typeof SUBDOMAIN_ENDPOINT]
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

export function adjustRateLimits (clientLimits: RateLimiter[], headers: Headers) { /* eslint-disable no-console */
  const DEBUG = false

  if (!headers.has('x-rate-limit-ip') || !headers.get('x-rate-limit-ip-state')) return clientLimits

  const limitIpState = headers.get('x-rate-limit-ip-state')!
    .split(',')
    .map(rule => rule.split(':'))
    .map(rule => Number(rule[0]))
  const limitIp = headers.get('x-rate-limit-ip')!
    .split(',')
    .map(rule => rule.split(':'))
    .map((rule, idx) => ({
      max: Number(rule[0]),
      window: Number(rule[1]),
      state: limitIpState[idx]
    }))

  // destroy
  for (const limit of clientLimits) {
    const isActive = limitIp.some(serverLimit => limit.isEqualLimit(serverLimit))
    if (!isActive) {
      limit.destroy()
      DEBUG && console.log('Destroy', limit.toString())
    }
  }

  // filter active
  clientLimits = clientLimits.filter(limit =>
    limitIp.some(serverLimit => limit.isEqualLimit(serverLimit))
  )

  // compare client<>server state
  for (const limit of clientLimits) {
    const serverLimit = limitIp.find(serverLimit => limit.isEqualLimit(serverLimit))!
    const delta = (serverLimit.state - limit.state.stack.length)

    if (delta === 0) {
      DEBUG && console.log('Limits are in sync')
    } else if (delta > 0) {
      DEBUG && console.error(`Rate limit state on Server is greater by ${Math.abs(delta)}. Bursting to prevent rate limiting.`)
      Array(delta).fill(undefined).forEach(() => {
        limit.wait()
      })
    } else if (delta < 0) {
      DEBUG && console.warn(`Rate limit state on Client is greater by ${Math.abs(delta)}`)
    }
  }

  // add new
  for (const serverLimit of limitIp) {
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
