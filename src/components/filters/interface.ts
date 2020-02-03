import { ItemInfluence, ItemCategory } from '../parser'

export interface ItemFilters {
  name?: {
    value: string
  }
  baseType?: {
    value: string
  }
  category?: {
    value: ItemCategory
  }
  rarity?: {
    value: string
  }
  linkedSockets?: {
    value: number
    disabled: boolean
  }
  corrupted?: {
    value: boolean
  }
  influences?: Array<{
    value: ItemInfluence
    disabled: boolean
  }>
  quality?: {
    min?: number
    max?: number
  }
  gemLevel?: {
    min?: number
    max?: number
  }
  mapTier?: {
    value: number
  }
  itemLevel?: {
    value: number
    disabled: boolean
  }
}
