import type { ItemCategory } from '@/parser'

export interface StatMatcher {
  string: string
  ref: string
  negate?: true
  condition?: {
    min?: number
    max?: number
  }
  option?: {
    text: string
    tradeId: string | number
  }
}

export interface Stat {
  text: string
  ref: string
  inverted?: true
  types: Array<{
    name: string
    tradeId: string[]
  }>
}

export interface BaseType {
  category: ItemCategory
  icon?: string
}
