import prophecies from './prophecies.json'
import monsters from './itemised-monsters.json'
import mods from './mods.json'
import baseTypes from './base-types.json'
import uniques from './uniques.json'
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
    tradeId: string | string[]
  }>
}

export const Prophecies = new Set(prophecies as string[])
export const ItemisedMonsters = new Set(monsters as string[])

export interface BaseType {
  category: ItemCategory
  icon?: string
}

export const BaseTypes = new Map(baseTypes as Array<[string, BaseType]>)

// Mods
export const Mods = new Map<string, { condition: StatMatcher, mod: Mod }>()
export const STAT_BY_TEXT = new Map<string, Mod>()

for (const entry of (mods as Array<{ conditions: StatMatcher[], mod: Mod }>)) {
  for (const condition of entry.conditions) {
    Mods.set(condition.string, {
      condition,
      mod: entry.mod
    })
  }
  STAT_BY_TEXT.set(entry.mod.text, entry.mod)
}

// assertion, to avoid regressions in mods.json
export function stat (text: string) {
  if (!STAT_BY_TEXT.has(text)) {
    throw new Error(`Cannot find stat: ${text}`)
  }
  return text
}

export interface UniqueItem {
  icon: string
  mods: Array<{
    text: string
    implicit?: true
    variant?: true
    bounds: Array<{ min: number, max: number }>
  }>
}

export const Uniques = new Map(uniques as Array<[string, UniqueItem]>)
