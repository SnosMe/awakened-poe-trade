import { STAT_BY_MATCH_STR } from '@/assets/data'
import type { ModifierType } from './modifiers'

// This file is a little messy and scary,
// but that's how stats translations are parsed :-D

export interface ParsedStat {
  translation: string
  roll?: {
    unscalable: boolean
    negate: boolean
    dp: boolean
    value: number
    min: number
    max: number
  }
}

export function * linesToStatStrings (lines: string[]): Generator<string, string[], boolean> {
  const notParsedLines: string[] = []

  outer:
  for (let start = 0; start < lines.length; start += 1) {
    for (let end = start; end < lines.length; end += 1) {
      const str = lines.slice(start, end + 1).join('\n')
      const isParsed: boolean = yield str
      if (isParsed) {
        continue outer
      }
    }
    notParsedLines.push(lines[start])
  }
  return notParsedLines
}

const PLACEHOLDER_MAP = [
  // 0 # -> max 0 #
  [[]],
  // 1 # -> max 1 #
  [[0], []],
  // 2 # -> max 2 #
  [[0, 1], [0], [1], []],
  // 3 # -> max 2 #
  [[0, 1, 2], [1, 2], [0, 2], [0, 1], [2], [1], [0]],
  // 4 # -> max 2 #
  [[0, 1, 2, 3], [1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2], [2, 3], [1, 3], [1, 2], [0, 3], [0, 2], [0, 1]]
]

function * _statPlaceholderGenerator (stat: string) {
  // combinations to detect stat text range "Victario(Cadiro-Victario)"
  //                                                  ^^^^^^ ^^^^^^^^
  // but ignore (dashed-text) literal inside translation string
  function * _firstPass (stat: string): Generator<string, void> {
    const matches = [] as string[]
    const withPlaceholders = stat
      .replace(/(?:(?<!\x20|\d)\((?<min>.[^)-]*)-(?<max>[^)]+)\))/gm, (match, min, max) => {
        if (Number.isNaN(Number(min)) || Number.isNaN(Number(max))) {
          matches.push(match)
          return '#'
        } else {
          return match
        }
      })

    for (let j = 0; j < 2 ** matches.length; j += 1) {
      const replacements: number[] = []
      for (let idx = 0; idx < matches.length; idx += 1) {
        if ((j & (2 ** idx))) {
          replacements.push(idx)
        }
      }

      {
        let idx = -1
        yield withPlaceholders.replace(/#/gm, () => {
          idx += 1
          return replacements.includes(idx)
            ? matches[idx]
            : ''
        })
      }
    }
  }

  for (stat of _firstPass(stat)) {
    const matches: Array<{
      roll: number
      rollStr: string
      decimal: boolean
      bounds?: { min: number, max: number }
    }> = []
    const withPlaceholders = stat
      .replace(/(?<value>(?<!\d|\))[+-]?\d+(?:\.\d+)?)(?:\((?<min>.[^)-]*)(?:-(?<max>[^)]+))?\))?/gm, (_, roll: string, min?: string, max?: string) => {
        if (min != null && max == null) {
          // example: Watchstone "# uses remaining"
          max = min
        }

        const captured: typeof matches[number] = {
          roll: Number(roll),
          rollStr: roll,
          decimal: roll.includes('.') || min?.includes('.') || max?.includes('.') || false,
          bounds: { min: Number(min), max: Number(max) }
        }
        matches.push(captured)

        if (Number.isNaN(captured.bounds!.min) || Number.isNaN(captured.bounds!.max)) {
          captured.bounds = undefined
          return (min != null) ? `#(${min}-${max})` : '#'
        } else {
          return '#'
        }
      })

    if (matches.length < PLACEHOLDER_MAP.length) {
      for (const replacements of PLACEHOLDER_MAP[matches.length]) {
        let idx = -1
        const replaced = withPlaceholders.replace(/#/gm, () => {
          idx += 1
          return replacements.includes(idx)
            ? matches[idx].rollStr
            : '#'
        })

        yield {
          stat: replaced,
          values: matches
            .filter((_, idx) => !replacements.includes(idx)) as
              Array<Pick<typeof matches[number], 'roll' | 'bounds' | 'decimal'>>
        }
      }
    }
  }
}

export function tryParseTranslation (stat: string, modType: ModifierType): ParsedStat | undefined {
  for (const combination of _statPlaceholderGenerator(stat)) {
    const found = STAT_BY_MATCH_STR.get(combination.stat)
    if (!found || !found.stat.trade.ids[modType]) {
      continue
    }

    if (found.matcher.negate) {
      for (const stat of combination.values) {
        stat.roll *= -1
        if (stat.bounds) {
          // do not swap (TODO: or do? can't say from Ventor's Gamble)
          stat.bounds.min *= -1
          stat.bounds.max *= -1
        }
      }
    }

    if (!combination.values.length && found.matcher.value) {
      combination.values = [{
        roll: found.matcher.value,
        decimal: false,
        bounds: {
          min: found.matcher.value,
          max: found.matcher.value
        }
      }]
    }

    return {
      translation: found.matcher.string,
      roll: combination.values.length
        ? {
            unscalable: found.stat.stat.unscalable ?? false,
            negate: found.matcher.negate ?? false,
            dp: found.stat.stat.dp || combination.values.some(stat => stat.decimal),
            value: getRollOrMinmaxAvg(combination.values.map(stat => stat.roll)),
            min: getRollOrMinmaxAvg(combination.values.map(stat => stat.bounds?.min ?? stat.roll)),
            max: getRollOrMinmaxAvg(combination.values.map(stat => stat.bounds?.max ?? stat.roll))
          }
        : undefined
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
