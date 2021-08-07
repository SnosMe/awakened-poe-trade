/* eslint-disable @typescript-eslint/no-var-requires */

import type { TranslationDict } from '@/assets/data/en/client_strings'
import type { ClientLogDict } from '@/assets/data/en/client_log'
import type { BaseType, DropEntry, Stat, StatMatcher, UniqueItem } from './interfaces'
import { Config } from '@/web/Config'
import { nameToDetailsId } from '@/web/price-check/trends/getDetailsId'

export * from './interfaces'

export let CLIENT_STRINGS: TranslationDict
export let CLIENTLOG_STRINGS: ClientLogDict
export let ITEM_NAME_REF_BY_TRANSLATED: Map<string | undefined, string>
export let TRANSLATED_ITEM_NAME_BY_REF: Map<string | undefined, string>

export let STATS: Stat[]

export const STAT_BY_MATCH_STR = new Map<string, { matcher: StatMatcher, stat: Stat }>()
export const STAT_BY_REF = new Map<string, Stat>()

export let BASE_TYPES: Map<string, BaseType>

export let TRADE_TAGS: Array<[string, string]>
export let TRADE_TAG_BY_NAME: Map<string, string>

export let UNIQUES_LIST: UniqueItem[]
export let UNIQUES: Map<string, UniqueItem>

export let MAP_IMGS: Map<string, { img: string }>

export const ITEM_DROP = new Map<string, DropEntry>()

;(function initData () { /* eslint-disable no-lone-blocks */
  {
    CLIENT_STRINGS = (require(`./${Config.store.language}/client_strings`).default)
    CLIENTLOG_STRINGS = (require(`./${Config.store.language}/client_log`).default)

    const itemNames: Array<[string, string]> = (require(`./${Config.store.language}/item-names.json`))
    TRANSLATED_ITEM_NAME_BY_REF = new Map(itemNames)
    ITEM_NAME_REF_BY_TRANSLATED = new Map(itemNames.map(_ => [_[1], _[0]]))
  }

  {
    STATS = (require(`./${Config.store.language}/stats.json`))
    for (const entry of STATS) {
      for (const condition of entry.stat.matchers) {
        STAT_BY_MATCH_STR.set(condition.string, { matcher: condition, stat: entry })
        if (condition.advanced) {
          STAT_BY_MATCH_STR.set(condition.advanced, { matcher: condition, stat: entry })
        }
      }
      STAT_BY_REF.set(entry.stat.ref, entry)
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
        ITEM_DROP.set(nameToDetailsId(query), {
          items: entry.items.map(nameToDetailsId),
          query: entry.query.map(nameToDetailsId)
        })
      }
    }
  }

  {
    const maps: Array<[string, { img: string }]> = (require('./maps.json'))
    MAP_IMGS = new Map(maps)
  }
})()

// assertion, to avoid regressions in stats.json
export function stat (text: string) {
  if (!STAT_BY_REF.has(text)) {
    throw new Error(`Cannot find stat: ${text}`)
  }
  return text
}
