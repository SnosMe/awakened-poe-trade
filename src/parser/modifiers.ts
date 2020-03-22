import { Mods, Mod, StatMatcher } from '@/assets/data'
import { CLUSTER_JEWEL_GRANT } from './constants'

export enum ModifierType {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Enchant = 'enchant'
}

export interface ItemModifier {
  modInfo: Mod
  values?: number[]
  option?: StatMatcher['option']
  condition?: StatMatcher['condition']
  negatedValues?: true
  type: ModifierType
}

export function * sectionToStatStrings (section: string[]) {
  let idx = 0
  let multi = (idx + 1) < section.length

  while (idx < section.length) {
    let str: string
    if (multi) {
      const lines = [
        section[idx],
        section[idx + 1]
      ]
      if (lines.every(l => l.startsWith(CLUSTER_JEWEL_GRANT))) {
        lines[1] = lines[1].substr(CLUSTER_JEWEL_GRANT.length)
      }
      str = lines.join('\n')
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
      }
    }
  }
  return true
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

    const found = Mods.get(possibleStat)
    if (found) {
      const values = matches
        .filter((_, idx) => !combo.includes(idx))
        .map(str => Number(str) * (found.condition.negate ? -1 : 1))

      return {
        modInfo: found.mod,
        values: values.length ? values : undefined,
        option: found.condition.option,
        condition: found.condition.condition,
        negatedValues: found.condition.negate,
        type: undefined!
      }
    }
  }
}
