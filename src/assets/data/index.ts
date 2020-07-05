import baseTypes from './base-types.json'
import uniques from './uniques.json'
import tradeTags from './trade-tags.json'
import itemDrop from './item-drop.json'
import { ItemCategory } from '@/parser'
import type { TranslationDict } from '@/assets/data/ru/client_strings'
import { Config } from '@/web/Config'

export let clientStrings: TranslationDict
export let itemNameRefByTranslated: Map<string, string>
export let translatedItemNameByRef: Map<string, string>

export let stats: Array<{ conditions: StatMatcher[], mod: Stat }>

// Mods
export const STAT_BY_MATCH_STR = new Map<string, { matcher: StatMatcher, stat: Stat, matchers: StatMatcher[] }>()
export const STAT_BY_REF = new Map<string, Stat>()

;(async function initData () {
  clientStrings = (require(`@/assets/data/${Config.store.language}/client_strings`).default)
  console.log(clientStrings)

  const itemNames: Array<[string, string]> = (require(`@/assets/data/${Config.store.language}/item-names`))
  translatedItemNameByRef = new Map(itemNames)
  itemNameRefByTranslated = new Map(itemNames.map(_ => [_[1], _[0]]))

  stats = (require(`@/assets/data/${Config.store.language}/stats`))
  for (const entry of stats) {
    for (const condition of entry.conditions) {
      STAT_BY_MATCH_STR.set(condition.string, {
        matcher: condition,
        stat: entry.mod,
        matchers: entry.conditions
      })
    }
    STAT_BY_REF.set(entry.mod.ref, entry.mod)
  }
})()

export interface StatMatcher {
  string: string
  ref: string
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

export interface Stat {
  text: string
  ref: string
  inverted?: true
  types: Array<{
    name: string
    tradeId: string[]
  }>
}

export interface BaseType {
  category: ItemCategory
  icon?: string
}

export const BaseTypes = new Map(baseTypes as Array<[string, BaseType]>)

// assertion, to avoid regressions in stats.json
export function stat (text: string) {
  if (!STAT_BY_REF.has(text)) {
    throw new Error(`Cannot find stat: ${text}`)
  }
  return text
}

export const TRADE_TAGS = tradeTags as Array<[string, string]>
export const TRADE_TAG_BY_NAME = new Map(TRADE_TAGS)

export interface UniqueItem {
  name: string
  basetype: string
  icon: string
  props: {
    pdps?: { min: number, max: number }
    ar?: { min: number, max: number }
    ev?: { min: number, max: number }
    es?: { min: number, max: number }
  }
  stats: Array<{
    text: string
    implicit?: true
    variant?: true
    bounds: Array<{ min: number, max: number }>
  }>
}

export const Uniques = new Map(
  (uniques as UniqueItem[]).map(item => [`${item.name} ${item.basetype}`, item])
)

export const UniquesList = (uniques as UniqueItem[])

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
