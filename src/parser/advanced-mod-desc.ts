import { CLIENT_STRINGS as _$ } from '@/assets/data'
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

export function applyIncr (mod: ModifierInfo, stat: ParsedStat): ParsedStat | null {
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

  for (const mod of mods) {
    for (const stat of mod.stats) {
      // if (out.some(merged => merged.stat.ref === stat)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      stat
      // }
    }
  }

  return out
}
