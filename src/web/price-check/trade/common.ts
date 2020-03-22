import { ItemFilters, StatFilter } from '../filters/interfaces'
import { TRADE_TAG_BY_NAME } from '@/assets/data'

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
