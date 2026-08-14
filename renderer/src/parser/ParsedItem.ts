import type { ModifierType, StatCalculated } from './modifiers'
import type { ParsedModifier } from './advanced-mod-desc'
import type { ParsedStat } from './stat-translations'
import type { BaseType, MercenaryBuild } from '@/assets/data'
import { ItemCategory } from './meta'

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
  itemLevel?: number

  armourAR?: number
  armourEV?: number
  armourES?: number
  armourWARD?: number
  armourBLOCK?: number
  basePercentile?: number
  weaponCRIT?: number
  weaponAS?: number
  weaponPHYSICAL?: number
  weaponELEMENTAL?: number

  mapArea?: BaseType
  areaLevel?: number
  areaItemQuantity?: number
  areaItemRarity?: number
  areaPackSize?: number
  mapBlighted?: 'Blighted' | 'Blight-ravaged'
  mapCompletionReward?: BaseType
  mapTier?: number
  mapMoreMaps?: number
  mapMoreScarabs?: number
  mapMoreCurrency?: number
  mapMoreDivCards?: number
  heistBlueprint?: {
    wingsRevealed?: number
    target?: 'Enchants' | 'Trinkets' | 'Gems' | 'Replicas'
  }
  heistContract?: {
    requiredJob?: 'Lockpicking' | 'Brute Force' | 'Perception' | 'Demolition' | 'Counter-Thaumaturgy' | 'Trap Disarmament' | 'Agility' | 'Deception' | 'Engineering'
    jobLevel?: number
    targetValue?: 'Priceless'
  }
  logbookAreaMods?: ParsedModifier[][]
  chartSulphur?: number

  gemLevel?: number
  imbuedGem?: boolean
  mercenaryBuild?: MercenaryBuild
  mercenarySkills?: ParsedStat[][]
  talismanTier?: number
  memoryStrands?: number
  quality?: number
  sockets?: {
    linked?: number // only 5 or 6
    white: number
  }
  stackSize?: { value: number, max: number }
  isUnidentified: boolean
  isCorrupted: boolean
  isUnmodifiable?: boolean
  isMirrored?: boolean
  isSplit?: boolean
  influences: ItemInfluence[]
  sentinelCharge?: number
  isSynthesised?: boolean
  isFractured?: boolean
  isVeiled?: boolean
  isFoil?: boolean
  isFoulborn?: boolean
  isVestigial?: boolean
  statsByType: StatCalculated[]
  newMods: ParsedModifier[]
  unknownModifiers: Array<{
    text: string
    type: ModifierType
  }>
  category?: ItemCategory
  info: BaseType
  rawText: string
}

// NOTE: should match option values on trade
export enum IncursionRoom {
  Open = 1,
  Obstructed = 2
}

export function createVirtualItem (
  props: Partial<ParsedItem> & Pick<ParsedItem, 'info'>
): ParsedItem {
  return {
    ...props,
    isUnidentified: props.isUnidentified ?? false,
    isCorrupted: props.isCorrupted ?? false,
    newMods: props.newMods ?? [],
    statsByType: props.statsByType ?? [],
    unknownModifiers: props.unknownModifiers ?? [],
    influences: props.influences ?? [],
    rawText: 'VIRTUAL_ITEM'
  }
}
