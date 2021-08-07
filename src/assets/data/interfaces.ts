import type { ItemCategory } from '@/parser'

export interface StatMatcher {
  string: string
  advanced?: string
  negate?: true
  value?: number
}

export interface Stat {
  stat: {
    ref: string
    dp?: true
    matchers: StatMatcher[]
  }
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
