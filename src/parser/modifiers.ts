import { STAT_BY_MATCH_STR, Stat, StatMatcher, CLIENT_STRINGS as _$ } from '@/assets/data'
import * as C from './constants'

export enum ModifierType {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Enchant = 'enchant',
  Veiled = 'veiled',
  Fractured = 'fractured'
}

export interface ItemModifier extends
  Stat,
  Pick<StatMatcher, 'string' | 'negate'> {
  value?: number
  type: ModifierType
}

export function * sectionToStatStrings (section: string[]): Generator<string, string[], boolean> {
  const notParsedLines: string[] = []

  let idx = 0
  let multi = (idx + 1) < section.length

  while (idx < section.length) {
    let str: string

    if (multi) {
      if (
        section[idx].startsWith(_$[C.CLUSTER_JEWEL_GRANT]) &&
        section[idx + 1].startsWith(_$[C.CLUSTER_JEWEL_GRANT])
      ) {
        str = `${section[idx].slice(0, -C.ENCHANT_SUFFIX.length)}\n${section[idx + 1]}`
      } else if (
        section[idx].endsWith(C.IMPLICIT_SUFFIX) ||
        section[idx].endsWith(C.CRAFTED_SUFFIX) ||
        section[idx].endsWith(C.ENCHANT_SUFFIX) ||
        section[idx].endsWith(C.FRACTURED_SUFFIX)
      ) {
        multi = false
        str = section[idx]
      } else {
        str = `${section[idx]}\n${section[idx + 1]}`
      }
    } else {
      str = section[idx]
    }

    const isParsed: boolean = yield str

    if (isParsed) {
      idx += multi ? 2 : 1
      multi = (idx + 1) < section.length
    } else {
      if (multi) {
        multi = false
      } else {
        idx += 1
        multi = (idx + 1) < section.length
        notParsedLines.push(str)
      }
    }
  }
  return notParsedLines
}

const PLACEHOLDER_MAP = [
  // 0 #
  [[]],
  // 1 #
  [[0], []],
  // 2 #
  [[0, 1], [0], [1], []],
  // 3 #
  [[0, 1, 2], [1, 2], [0, 2], [0, 1], [2], [1], [0]],
  // 4 #
  [[0, 1, 2, 3], [1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2], [2, 3], [1, 3], [1, 2], [0, 3], [0, 2], [0, 1]]
]

export function tryFindModifier (stat: string): ItemModifier | undefined {
  const matches = [] as string[]

  const withPlaceholders = stat
    .replace(/(?<![\d#])[+-]?[\d.]+/gm, (value) => {
      matches.push(value)
      return '#'
    })

  if (matches.length >= PLACEHOLDER_MAP.length) return

  const comboVariants = PLACEHOLDER_MAP[matches.length]
  for (const combo of comboVariants) {
    let pIdx = -1
    const possibleStat = withPlaceholders.replace(/#/gm, () => {
      pIdx += 1
      if (combo.includes(pIdx)) {
        return matches[pIdx]
      } else {
        return '#'
      }
    })

    const found = STAT_BY_MATCH_STR.get(possibleStat)
    if (found) {
      let values = matches
        .filter((_, idx) => !combo.includes(idx))
        .map(str => Number(str) * (found.matcher.negate ? -1 : 1))

      if (!values.length && found.matcher.value) {
        values = [found.matcher.value]
      }

      return {
        stat: found.stat.stat,
        trade: found.stat.trade,
        string: found.matcher.string,
        negate: found.matcher.negate,
        value: values.length ? getRollOrMinmaxAvg(values) : undefined,
        type: undefined!
      }
    }
  }
}

export function getRollOrMinmaxAvg (values: number[]): number {
  if (values.length === 2) {
    return (values[0] + values[1]) / 2
  } else {
    return values[0]
  }
}
