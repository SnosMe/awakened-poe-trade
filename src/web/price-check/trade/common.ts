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

export const SEARCH_LIMIT = [
  new RateLimiter(8, 6),
  new RateLimiter(12, 30),
  new RateLimiter(15, 60)
]

export const FETCH_LIMIT = [
  new RateLimiter(4, 4),
  new RateLimiter(8, 12),
  new RateLimiter(10, 30)
]
