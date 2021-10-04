/* eslint-disable @typescript-eslint/no-var-requires */

import type { TranslationDict } from '@/assets/data/en/client_strings'
import type { ClientLogDict } from '@/assets/data/en/client_log'
import type { BaseType, DropEntry, Stat, StatMatcher, UniqueItem } from './interfaces'
import { AppConfig } from '@/web/Config'
import { nameToDetailsId } from '@/web/price-check/trends/getDetailsId'

export * from './interfaces'

export let CLIENT_STRINGS: TranslationDict
export let CLIENTLOG_STRINGS: ClientLogDict
export let ITEM_NAME_REF_BY_TRANSLATED: Map<string | undefined, string>
export let TRANSLATED_ITEM_NAME_BY_REF: Map<string | undefined, string>

class MapNDJSON<K, V> {
  #data: string
  #mapFn?: (key: K, value: unknown) => V
  #map = new Map<K, number>()

  constructor (
    data: string,
    mapFn?: (key: K, value: unknown) => V
  ) {
    this.#data = data
    this.#mapFn = mapFn
  }

  set (key: K, line: number): void {
    this.#map.set(key, line)
  }

  get (key: K): V | undefined {
    const start = this.#map.get(key)
    if (start !== undefined) {
      const end = this.#data.indexOf('\n', start)
      const entry = JSON.parse(this.#data.slice(start, end))
      if (this.#mapFn) {
        return this.#mapFn(key, entry)
      } else {
        return entry
      }
    }
  }

  has (key: K): boolean {
    return this.#map.has(key)
  }

  keys () {
    return this.#map.keys()
  }
}

export let STAT_BY_MATCH_STR: MapNDJSON<string, { matcher: StatMatcher, stat: Stat }>
export let STAT_BY_REF: MapNDJSON<string, Stat>

export let BASE_TYPES: Map<string, BaseType>

export let TRADE_TAGS: Array<[string, string]>
export let TRADE_TAG_BY_NAME: Map<string, string>

export let UNIQUES_LIST: UniqueItem[]
export let UNIQUES: Map<string, UniqueItem>

export let MAP_IMGS: Map<string, { img: string }>

export const ITEM_DROP = new Map<string, DropEntry>()

;(function initData () { /* eslint-disable no-lone-blocks */
  const { language } = AppConfig()

  {
    CLIENT_STRINGS = (require(`./${language}/client_strings`).default)
    CLIENTLOG_STRINGS = (require(`./${language}/client_log`).default)

    const itemNames: Array<[string, string]> = (require(`./${language}/item-names.json`))
    TRANSLATED_ITEM_NAME_BY_REF = new Map(itemNames)
    ITEM_NAME_REF_BY_TRANSLATED = new Map(itemNames.map(_ => [_[1], _[0]]))
  }

  {
    const STATS_RAW: string = (require(`./${language}/stats.ndjson?raw`))
    STAT_BY_REF = new MapNDJSON(STATS_RAW)
    STAT_BY_MATCH_STR = new MapNDJSON(STATS_RAW, (matchStr, stat) => {
      return {
        stat: (stat as Stat),
        matcher: (stat as Stat).matchers.find(m =>
          m.string === matchStr ||
          m.advanced === matchStr)!
      }
    })

    let start = 0
    while (start !== STATS_RAW.length) {
      const end = STATS_RAW.indexOf('\n', start)
      const stat: Stat = JSON.parse(STATS_RAW.slice(start, end))

      for (const condition of stat.matchers) {
        STAT_BY_MATCH_STR.set(condition.string, start)
        if (condition.advanced) {
          STAT_BY_MATCH_STR.set(condition.advanced, start)
        }
      }
      STAT_BY_REF.set(stat.ref, start)

      start = end + 1
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
