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
  fromAreaMods?: true
  fromHeistAreaMods?: true
  trade: {
    inverted?: true
    option?: 'num' | 'str'
    ids: {
      [type: string]: string[]
    }
  }
}

export interface DropEntry {
  query: string[]
  items: string[]
}

export interface BlightRecipes {
  oils: string[]
  recipes: {
    [statValue: number]: number[]
  }
}

export interface BaseType {
  name: string
  refName: string
  namespace: (
    'DIVINATION_CARD' |
    'CAPTURED_BEAST' |
    'PROPHECY' |
    'UNIQUE' |
    'ITEM' |
    'GEM'
  )
  icon: string
  tradeTag?: string
  tradeDisc?: string
  disc?: {
    propAR?: true
    propEV?: true
    propES?: true
    hasImplicit?: { ref: string }
    hasExplicit?: { ref: string }
    sectionText?: string
    mapTier?: 'W' | 'Y' | 'R'
  }
  // extra info
  craftable?: {
    category: ItemCategory
    corrupted?: true
    uniqueOnly?: true
  }
  unique?: {
    base: string
  }
  map?: {
    screenshot?: string
  }
  prophecy?: {
    masterName?: string
  }
  gem?: {
    vaal?: true
    awakened?: true
    altQuality?: string[]
    normalVariant?: string
  }
}
