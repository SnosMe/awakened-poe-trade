import type { ItemCategory } from '@/parser'

export interface StatMatcher {
  string: string
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

export interface DropEntry {
  query: string[]
  items: string[]
}

export interface UniqueItem {
  name: string
  basetype: string
  icon: string
  stats: Array<{
    text: string
    implicit?: true
    variant?: true
    bounds: Array<{ min: number, max: number }>
  }>
}
