import prophecies from './prophecies.json'
import monsters from './itemised-monsters.json'
import mods from './mods.json'
import baseTypes from './base-types.json'
import { ItemCategory } from '../components/parser'

export interface StatMatcher {
  string: string
  negate?: true
  condition?: {
    min?: number
    max?: number
  }
  option?: {
    text: string
    tradeId: string | number
  }
}

export interface Mod {
  text: string
  types: Array<{
    name: string
    tradeId?: string
  }>
}

export const Prophecies = new Set(prophecies as string[])
export const ItemisedMonsters = new Set(monsters as string[])

export interface BaseType {
  category: ItemCategory
}

export const BaseTypes = new Map(baseTypes as Array<[string, BaseType]>)

// Mods
export const Mods = new Map<string, { condition: StatMatcher, mod: Mod }>()

for (const entry of (mods as Array<{ conditions: StatMatcher[], mod: Mod }>)) {
  for (const condition of entry.conditions) {
    Mods.set(condition.string, {
      condition,
      mod: entry.mod
    })
  }
}
