import type { ItemInfluence, ItemCategory } from '@/parser'
import type { StatCalculated } from '@/parser/modifiers'
import type { HeistJob, ParsedItem } from '@/parser/ParsedItem'
import type { Stat } from '@/assets/data'

export interface ItemFilters {
  name?: {
    value: string
  }
  baseType?: {
    value: string
    trade?: string
  }
  discriminator?: {
    value: string
    trade: string
  }
  category?: {
    value: ItemCategory
  }
  rarity?: {
    value: string
  }
  linkedSockets?: FilterNumeric
  whiteSockets?: FilterNumeric
  corrupted?: {
    value: boolean
  }
  mirrored?: {
    value: boolean
  }
  influences?: Array<{
    value: ItemInfluence
    disabled: boolean
  }>
  quality?: FilterNumeric
  gemLevel?: {
    min: number
    max?: number
    disabled: boolean
  }
  mapTier?: {
    value: number
  }
  mapBlighted?: {
    value: NonNullable<ParsedItem['mapBlighted']>
  }
  itemLevel?: FilterNumeric
  stackSize?: FilterNumeric
  unidentified?: {
    value: true
    disabled: boolean
  }
  veiled?: {
    statRefs: string[]
    disabled: boolean
  }
  altQuality?: {
    value: NonNullable<ParsedItem['gemAltQuality']>
    disabled: boolean
  }
  areaLevel?: {
    value: number
  }
  heistJob?: {
    name: HeistJob
    level: number
  }
  trade: {
    offline: boolean
    listed: string | undefined
    league: string
    chaosPriceThreshold: number
    collapseListings: 'api' | 'app'
  }
}

export interface FilterNumeric {
  value: number
  disabled: boolean
}

export interface StatFilter {
  tradeId: string[]
  statRef: string
  text: string
  tag: FilterTag
  sources: StatCalculated['sources']
  roll?: {
    value: number
    min: number | '' | undefined // NOTE: mutable in UI
    max: number | '' | undefined // NOTE: mutable in UI
    default: { min: number, max: number }
    bounds?: { min: number, max: number }
    tradeInvert?: boolean
    dp: boolean
    isNegated: boolean
  }
  option?: {
    value: number // NOTE: mutable in UI
    tradeValue: NonNullable<Stat['trade']['option']>
  }
  hidden?: string
  disabled: boolean // NOTE: mutable in UI
}

export const INTERNAL_TRADE_IDS = [
  'armour.armour',
  'armour.evasion_rating',
  'armour.energy_shield',
  'armour.ward',
  'armour.block',
  'weapon.total_dps',
  'weapon.physical_dps',
  'weapon.elemental_dps',
  'weapon.crit',
  'weapon.aps',
  'map.no_elder_guardian',
  'item.has_empty_modifier'
] as const

export type InternalTradeId = typeof INTERNAL_TRADE_IDS[number]

export enum ItemHasEmptyModifier {
  Any = 0,
  Prefix = 1,
  Suffix = 2
}

export enum FilterTag {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Enchant = 'enchant',
  Scourge = 'scourge',
  Fractured = 'fractured',
  Corrupted = 'corrupted',
  Synthesised = 'synthesised',
  Variant = 'variant',
  Influence = 'influence',
  Property = 'property',
}
