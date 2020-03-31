import mods from './mods.json'
import baseTypes from './base-types.json'
import uniques from './uniques.json'
import tradeTags from './trade-tags.json'
import itemDrop from './item-drop.json'
import { ItemCategory } from '@/parser'

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

export const TRADE_TAGS = tradeTags as Array<[string, string]>
export const TRADE_TAG_BY_NAME = new Map(TRADE_TAGS)

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

export interface DropEntry {
  query: string[]
  items: string[]
}

export const ITEM_DROP = new Map<string, DropEntry>()
for (const entry of (itemDrop as DropEntry[])) {
  for (const query of entry.query) {
    ITEM_DROP.set(query, entry)
  }
}

function apiTradeItemsToConsumableFormat (items: any) {
  const ret = items.result.flatMap((category: any) => category.entries) as any[]
  return ret.filter((item: any) => !item.disc) as Array<{ name?: string, type: string }>
}
export const API_TRADE_ITEMS = {
  us: apiTradeItemsToConsumableFormat(require('./api_trade_items/us.json')),
  kr: apiTradeItemsToConsumableFormat(require('./api_trade_items/kr.json')),
  th: apiTradeItemsToConsumableFormat(require('./api_trade_items/th.json'))
}
