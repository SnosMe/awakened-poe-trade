import type { ItemInfluence, ItemCategory } from '@/parser'
import type { ItemModifier } from '@/parser/modifiers'
import type { HeistJob, ParsedItem } from '@/parser/ParsedItem'

export interface ItemFilters {
  name?: {
    value: string
  }
  baseType?: {
    value: string
  }
  discriminator?: {
    value: string
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
    value: true
  }
  itemLevel?: FilterNumeric
  stackSize?: FilterNumeric
  unidentified?: {
    value: true
    disabled: boolean
  }
  veiled?: {
    stat: string
    disabled: boolean
  }
  altQuality?: {
    value: NonNullable<ParsedItem['extra']['altQuality']>
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
  }
}

export interface FilterNumeric {
  value: number
  disabled: boolean
}

export interface StatFilter {
  readonly tradeId: string[]
  readonly statRef: string
  readonly text: string
  readonly roll?: number
  readonly type: string
  readonly option?: ItemModifier['trade']['option']
  readonly defaultMin?: number
  readonly defaultMax?: number
  readonly boundMin?: number
  readonly boundMax?: number
  readonly variant?: true
  readonly corrupted?: true
  readonly hidden?: string
  readonly invert?: boolean
  disabled: boolean
  min: number | '' | undefined
  max: number | '' | undefined
}

export const INTERNAL_TRADE_IDS = [
  'armour.armour',
  'armour.evasion_rating',
  'armour.energy_shield',
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
