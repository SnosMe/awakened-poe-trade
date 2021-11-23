import type { ModifierType, StatCalculated } from './modifiers'
import type { ItemCategory } from './meta'
import type { ParsedModifier } from './advanced-mod-desc'

export enum ItemRarity {
  Normal = 'Normal',
  Magic = 'Magic',
  Rare = 'Rare',
  Unique = 'Unique'
}

export enum ItemInfluence {
  Crusader = 'Crusader',
  Elder = 'Elder',
  Hunter = 'Hunter',
  Redeemer = 'Redeemer',
  Shaper = 'Shaper',
  Warlord = 'Warlord'
}

export interface ParsedItem {
  rarity?: ItemRarity
  name: string
  baseType: string | undefined
  itemLevel?: number
  props: {
    armour?: number
    evasion?: number
    energyShield?: number
    ward?: number
    blockChance?: number
    critChance?: number
    attackSpeed?: number
    physicalDamage?: number
    elementalDamage?: number
    mapBlighted?: true
    mapTier?: number
    gemLevel?: number
    areaLevel?: number
    talismanTier?: number
  }
  quality?: number
  sockets: {
    linked?: number // only 5 or 6
    white?: number
  }
  stackSize?: { value: number, max: number }
  isUnidentified: boolean
  isCorrupted: boolean
  isMirrored?: boolean
  influences: ItemInfluence[]
  isSynthesised?: boolean
  isVeiled?: boolean
  statsByType: StatCalculated[]
  newMods: ParsedModifier[]
  unknownModifiers: Array<{
    text: string
    type: ModifierType
  }>
  extra: {
    prophecyMaster?: 'Alva' | 'Einhar' | 'Niko' | 'Jun' | 'Zana'
    altQuality?: 'Anomalous' | 'Divergent' | 'Phantasmal' | 'Superior'
  }
  heistJob?: { name: HeistJob, level: number }
  category?: ItemCategory
  icon?: string
  rawText: string
}

export type HeistJob =
  'Lockpicking' |
  'Counter-Thaumaturgy' |
  'Perception' |
  'Deception' |
  'Agility' |
  'Engineering' |
  'Trap Disarmament' |
  'Demolition' |
  'Brute Force'

// NOTE: should match option values on trade
export enum IncursionRoom {
  Open = 1,
  Obstructed = 2
}
