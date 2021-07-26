import { CLIENT_STRINGS as _$, STAT_BY_MATCH_STR } from '@/assets/data'
import * as C from './constants'
import { percentRoll } from '@/web/price-check/filters/util'
import type { ParsedStat } from './stat-translations'
import { LegacyItemModifier, ModifierType } from './modifiers'

export interface ParsedModifier {
  info: ModifierInfo
  stats: ParsedStat[]
}

export interface ModifierInfo {
  type: ModifierType
  generation?: 'suffix' | 'prefix'
  name?: string
  tier?: number
  rank?: number
  tags: string[]
  rollIncr?: number
}

export function parseModInfoLine (line: string, type: ModifierType): ModifierInfo {
  const [modText, tagsText, incrText] = line
    .slice(1, -1)
    .split('\u2014')
    .map(_ => _.trim())

  const match = modText.match(_$.MODIFIER_LINE)
  if (!match) {
    throw new Error('Invalid regex for mod info line')
  }

  let generation: ModifierInfo['generation']
  switch (match.groups!.type) {
    case _$.PREFIX_MODIFIER:
    case _$.CRAFTED_PREFIX:
      generation = 'prefix'; break
    case _$.SUFFIX_MODIFIER:
    case _$.CRAFTED_SUFFIX:
      generation = 'suffix'; break
  }

  const name = match.groups!.name || undefined
  const tier = Number(match.groups!.tier) || undefined
  const rank = Number(match.groups!.rank) || undefined
  const tags = tagsText ? tagsText.split(', ') : []
  const rollIncr = parseInt(incrText, 10) || undefined

  return { type, generation, name, tier, rank, tags, rollIncr }
}

export function isModInfoLine (line: string): boolean {
  return line.startsWith('{') && line.endsWith('}')
}

interface GroupedModLines {
  modLine: string
  statLines: string[]
}

export function * groupLinesByMod (lines: string[]): Generator<GroupedModLines, void> {
  if (!lines.length || !isModInfoLine(lines[0])) {
    return
  }

  let last: GroupedModLines | undefined
  for (const line of lines) {
    if (!isModInfoLine(line)) {
      last!.statLines.push(line)
    } else {
      if (last) { yield last }
      last = { modLine: line, statLines: [] }
    }
  }
  yield last!
}

export function parseModType (lines: string[]): { modType: ModifierType, lines: string[] } {
  let modType: ModifierType
  if (lines.some(line => line.endsWith(C.ENCHANT_LINE))) {
    modType = ModifierType.Enchant
    lines = removeLineEnding(lines, C.ENCHANT_LINE)
  } else if (lines.some(line => line.endsWith(C.IMPLICIT_LINE))) {
    modType = ModifierType.Implicit
    lines = removeLineEnding(lines, C.IMPLICIT_LINE)
  } else if (lines.some(line => line.endsWith(C.FRACTURED_LINE))) {
    modType = ModifierType.Fractured
    lines = removeLineEnding(lines, C.FRACTURED_LINE)
  } else if (lines.some(line => line.endsWith(C.CRAFTED_LINE))) {
    modType = ModifierType.Crafted
    lines = removeLineEnding(lines, C.CRAFTED_LINE)
  } else {
    modType = ModifierType.Explicit
  }

  lines = removeLineEnding(lines, _$.UNSCALABLE_VALUE)

  return { modType, lines }
}

function removeLineEnding (
  lines: readonly string[], ending: string
): string[] {
  return lines.map(line =>
    line.endsWith(ending)
      ? line.slice(0, -ending.length)
      : line
  )
}

// stat values internally stored as ints,
// this is the most common formatter
const DIV_BY_100 = 2

function applyIncr (mod: ModifierInfo, stat: ParsedStat): ParsedStat | null {
  const { rollIncr } = mod
  const { roll } = stat

  if (!rollIncr || !roll || roll.unscalable) {
    return null
  }

  return {
    translation: stat.translation,
    roll: {
      unscalable: roll.unscalable,
      negate: roll.negate,
      dp: roll.dp,
      value: percentRoll(roll.value, rollIncr, (roll.value > 0) ? Math.floor : Math.ceil, roll.dp && DIV_BY_100),
      min: percentRoll(roll.min, rollIncr, (roll.min > 0) ? Math.floor : Math.ceil, roll.dp && DIV_BY_100),
      max: percentRoll(roll.max, rollIncr, (roll.max > 0) ? Math.floor : Math.ceil, roll.dp && DIV_BY_100)
    }
  }
}

export function sumStatsFromMods (mods: readonly ParsedModifier[]): LegacyItemModifier[] {
  const out: LegacyItemModifier[] = []

  const merged: ParsedStat[] = []

  mods = mods.map(mod => ({
    ...mod,
    stats: mod.stats.map(stat =>
      applyIncr(mod.info, stat) ?? stat
    )
  }))

  for (const modA of mods) {
    for (const statA of modA.stats) {
      if (merged.includes(statA)) {
        continue
      }

      const dbStatA = STAT_BY_MATCH_STR.get(statA.translation)!.stat

      const toMerge = mods
        .reduce((filtered, modB) => {
          if (modB.info.type === modA.info.type) {
            const targetStat = modB.stats.find(statB =>
              dbStatA.stat.matchers.some(matcher => matcher.string === statB.translation)
            )
            if (targetStat) {
              filtered.push({
                info: modB.info,
                stat: targetStat
              })
            }
          }
          return filtered
        }, [] as Array<{ info: ModifierInfo, stat: ParsedStat }>)

      if (toMerge.length === 1) {
        out.push({
          stat: dbStatA.stat,
          trade: dbStatA.trade,
          string: statA.translation,
          type: modA.info.type,
          negate: statA.roll?.negate || undefined,
          value: statA.roll?.value
        })
      } else {
        const rollValue = toMerge.reduce((sum, { stat }) => sum + stat.roll!.value, 0)

        out.push({
          stat: dbStatA.stat,
          trade: dbStatA.trade,
          string:
            dbStatA.stat.matchers.find(m => m.value === rollValue)?.string ??
            dbStatA.stat.matchers.find(m => m.value == null && Boolean(m.negate) === statA.roll!.negate)?.string ??
            statA.translation,
          type: modA.info.type,
          negate: statA.roll!.negate || undefined,
          value: rollValue
        })
      }

      merged.push(...toMerge.map(mod => mod.stat))
    }
  }

  return out
}
