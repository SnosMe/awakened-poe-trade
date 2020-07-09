import type { TranslationDict } from '@/assets/data/en/client_strings'
import type { BaseType, DropEntry, Stat, StatMatcher, UniqueItem } from './interfaces'
import { Config } from '@/web/Config'

export * from './interfaces'

export let CLIENT_STRINGS: TranslationDict
export let ITEM_NAME_REF_BY_TRANSLATED: Map<string | undefined, string>
export let TRANSLATED_ITEM_NAME_BY_REF: Map<string | undefined, string>

export let STATS: Array<{ conditions: StatMatcher[], mod: Stat }>

export const STAT_BY_MATCH_STR = new Map<string, { matcher: StatMatcher, stat: Stat, matchers: StatMatcher[] }>()
export const STAT_BY_REF = new Map<string, Stat>()

export let BASE_TYPES: Map<string, BaseType>

export let TRADE_TAGS: Array<[string, string]>
export let TRADE_TAG_BY_NAME: Map<string, string>

export let UNIQUES_LIST: UniqueItem[]
export let UNIQUES: Map<string, UniqueItem>

export const ITEM_DROP = new Map<string, DropEntry>()

;(async function initData () { /* eslint-disable no-lone-blocks */
  {
    CLIENT_STRINGS = (require(`./${Config.store.language}/client_strings`).default)

    const itemNames: Array<[string, string]> = (require(`./${Config.store.language}/item-names.json`))
    TRANSLATED_ITEM_NAME_BY_REF = new Map(itemNames)
    ITEM_NAME_REF_BY_TRANSLATED = new Map(itemNames.map(_ => [_[1], _[0]]))
  }

  {
    STATS = (require(`./${Config.store.language}/stats.json`))
    for (const entry of STATS) {
      for (const condition of entry.conditions) {
        STAT_BY_MATCH_STR.set(condition.string, {
          matcher: condition,
          stat: entry.mod,
          matchers: entry.conditions
        })
      }
      STAT_BY_REF.set(entry.mod.ref, entry.mod)
    }
  }

  {
    const baseTypes: Array<[string, BaseType]> = (require('./base-types.json'))
    BASE_TYPES = new Map(baseTypes)
  }

  {
    const tradeTags: Array<[string, string]> = (require('./trade-tags.json'))
    TRADE_TAGS = tradeTags
    TRADE_TAG_BY_NAME = new Map(tradeTags)
  }

  {
    const uniques: UniqueItem[] = (require('./uniques.json'))
    UNIQUES_LIST = uniques
    UNIQUES = new Map(
      uniques.map(item => [`${item.name} ${item.basetype}`, item])
    )
  }

  {
    const itemDrop: DropEntry[] = (require('./item-drop.json'))
    for (const entry of itemDrop) {
      for (const query of entry.query) {
        ITEM_DROP.set(query, entry)
      }
    }
  }
})()

// assertion, to avoid regressions in stats.json
export function stat (text: string) {
  if (!STAT_BY_REF.has(text)) {
    throw new Error(`Cannot find stat: ${text}`)
  }
  return text
}
