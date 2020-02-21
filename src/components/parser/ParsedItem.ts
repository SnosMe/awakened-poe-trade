import { ItemRarity, ItemInfluence } from './constants'
import { ItemModifier } from './modifiers'
import { ItemCategory } from './meta'

export interface ParsedItem {
  rarity: ItemRarity
  name: string
  baseType: string | undefined
  itemLevel?: number
  props: {
    armour?: number
    evasion?: number
    energyShield?: number
    blockChance?: number
    critChance?: number
    attackSpeed?: number
    physicalDamage?: number[]
    elementalDamage?: number
    mapBlighted?: true
  }
  mapTier?: number
  quality?: number
  linkedSockets?: number // only 5 or 6
  stackSize?: number
  isUnidentified: boolean
  isCorrupted: boolean
  gemLevel?: number
  influences: ItemInfluence[]
  rawText: string
  modifiers: ItemModifier[]
  icon?: string
  computed: {
    category?: ItemCategory
  }
}
