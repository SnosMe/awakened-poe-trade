import type { ItemInfluence, ItemCategory } from '@/parser'
import type { StatCalculated } from '@/parser/modifiers'
import type { ParsedItem } from '@/parser/ParsedItem'

export interface FilterPreset {
  id: string
  filters: ItemFilters
  stats: StatFilter[]
}

interface SearchFilter {
  name?: string
  nameTrade?: string
  baseType?: string
  baseTypeTrade?: string
  category?: ItemCategory
}

export interface ItemFilters {
  searchExact: SearchFilter
  searchRelaxed?: SearchFilter & { disabled: boolean }
  discriminator?: {
    value?: string
    trade: string
  }
  rarity?: {
    value: string
    disabled: boolean
  }
  linkedSockets?: FilterNumeric
  whiteSockets?: FilterNumeric
  corrupted?: {
    value: boolean
    exact?: boolean
  }
  fractured?: {
    value: false
  }
  imbuedGem?: {
    disabled: true
  }
  mirrored?: {
    disabled: boolean
    hidden: boolean
  }
  split?: {
    disabled: boolean
    hidden: boolean
  }
  foil?: {
    disabled: boolean
  }
  foulborn?: {
    value: boolean
  }
  influences?: Array<{
    value: ItemInfluence
    disabled: boolean
  }>
  quality?: FilterNumeric
  gemLevel?: FilterNumeric
  mapTier?: FilterNumeric
  mapBlighted?: {
    value: NonNullable<ParsedItem['mapBlighted']>
  }
  mapCompletionReward?: {
    name: string
    nameTrade: string
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
  areaLevel?: FilterNumeric
  heistWingsRevealed?: FilterNumeric
  sentinelCharge?: FilterNumeric
  storedExperience?: FilterNumeric
  trade: {
    offline: boolean
    onlineInLeague: boolean
    merchantOnly: boolean
    listed: string | undefined
    currency: string | undefined
    league: string
    collapseListings: 'api' | 'app'
  }
}

export interface FilterNumeric {
  value: number
  max?: number | undefined
  disabled: boolean
}

export interface StatFilter {
  tradeId: string[]
  statRef: string
  text: string
  tag: FilterTag
  oils?: string[]
  sources: StatCalculated['sources']
  not?: true
  roll?: {
    value: number
    min: number | '' | undefined // NOTE: mutable in UI
    max: number | '' | undefined // NOTE: mutable in UI
    default: { min: number, max: number }
    bounds?: { min: number, max: number }
    tradeInvert?: boolean
    dp: boolean
    isNegated: boolean
    goodness?: number
  }
  option?: {
    value: number // NOTE: mutable in UI
  }
  hidden?: string
  disabled: boolean // NOTE: mutable in UI
}

const _INTERNAL_TRADE_IDS = [
  'item.base_percentile',
  'item.memory_strands',
  'item.armour',
  'item.evasion_rating',
  'item.energy_shield',
  'item.ward',
  'item.block',
  'item.total_dps',
  'item.physical_dps',
  'item.elemental_dps',
  'item.crit',
  'item.aps',
  'item.has_empty_modifier',
  'item.map_item_quantity',
  'item.map_item_rarity',
  'item.map_pack_size',
  'item.heist_job_lockpicking',
  'item.heist_job_bruteforce',
  'item.heist_job_perception',
  'item.heist_job_demolition',
  'item.heist_job_counterthaumaturgy',
  'item.heist_job_trapdisarmament',
  'item.heist_job_agility',
  'item.heist_job_deception',
  'item.heist_job_engineering',
  'item.heist_target_priceless'
] as const

export type InternalTradeId = typeof _INTERNAL_TRADE_IDS[number]
export const INTERNAL_TRADE_IDS = _INTERNAL_TRADE_IDS as readonly string[]

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
  Foulborn = 'foulborn',
  Eldritch = 'eldritch',
  Variant = 'variant',
  Property = 'property',
  Shaper = 'explicit-shaper',
  Elder = 'explicit-elder',
  Crusader = 'explicit-crusader',
  Hunter = 'explicit-hunter',
  Redeemer = 'explicit-redeemer',
  Warlord = 'explicit-warlord',
  Delve = 'explicit-delve',
  Unveiled = 'explicit-veiled',
  Incursion = 'explicit-incursion'
}
