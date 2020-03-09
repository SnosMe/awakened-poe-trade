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
    mapTier?: number
    gemLevel?: number
  }
  quality?: number
  sockets: {
    linked?: 5 | 6 // only 5 or 6
    white?: number
  }
  stackSize?: number
  isUnidentified: boolean
  isCorrupted: boolean
  influences: ItemInfluence[]
  modifiers: ItemModifier[]
  category?: ItemCategory
  icon?: string
  rawText: string
}
