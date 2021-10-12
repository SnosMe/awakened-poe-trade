import type { ItemCategory } from '@/parser'

export interface StatMatcher {
  string: string
  advanced?: string
  negate?: true
  value?: number
}

export enum StatBetter {
  NegativeRoll = -1,
  PositiveRoll = 1,
  NotComparable = 0
}

export interface Stat {
  ref: string
  dp?: true
  matchers: StatMatcher[]
  better: StatBetter
  trade: {
    inverted?: true
    option?: 'num' | 'str'
    ids: {
      [type: string]: string[]
    }
  }
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
}

export interface BlightRecipes {
  oils: string[]
  recipes: {
    [statValue: number]: number[]
  }
}
