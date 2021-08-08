import { CLIENT_STRINGS as _$, STAT_BY_MATCH_STR } from '@/assets/data'
import * as C from './constants'
import { percentRoll } from '@/web/price-check/filters/util'
import type { ParsedStat } from './stat-translations'
import { LegacyItemModifier, ModifierType } from './modifiers'
import { removeLinesEnding } from './Parser'

export interface ParsedModifier {
  info: ModifierInfo
  stats: ParsedStat[]
}

export interface ModifierInfo {
  type: ModifierType
  generation?: 'suffix' | 'prefix' | 'corrupted'
  name?: string
  tier?: number
  rank?: number
  tags: string[]
  rollIncr?: number
}

export function parseModInfoLine (line: string, type: ModifierType): ModifierInfo {
  const [modText, xText2, xText3] = line
    .slice(1, -1)
    .split('\u2014')
    .map(_ => _.trim())

  let generation: ModifierInfo['generation']
  let name: ModifierInfo['name']
  let tier: ModifierInfo['tier']
  let rank: ModifierInfo['rank']
  {
    const match = modText.match(_$.MODIFIER_LINE)
    if (!match) {
      throw new Error('Invalid regex for mod info line')
    }

    switch (match.groups!.type) {
      case _$.PREFIX_MODIFIER:
      case _$.CRAFTED_PREFIX:
        generation = 'prefix'; break
      case _$.SUFFIX_MODIFIER:
      case _$.CRAFTED_SUFFIX:
        generation = 'suffix'; break
      case _$.CORRUPTED_IMPLICIT:
        generation = 'corrupted'; break
    }

    name = match.groups!.name || undefined
    tier = Number(match.groups!.tier) || undefined
    rank = Number(match.groups!.rank) || undefined
  }

  let tags: ModifierInfo['tags']
  let rollIncr: ModifierInfo['rollIncr']
  {
    const incrText = (xText3 !== undefined)
      ? xText3
      : (xText2 !== undefined && _$.MODIFIER_INCREASED.test(xText2))
          ? xText2
          : undefined

    const tagsText = (xText2 !== undefined && incrText !== xText2)
      ? xText2
      : undefined

    tags = tagsText ? tagsText.split(', ') : []
    rollIncr = incrText ? Number(_$.MODIFIER_INCREASED.exec(incrText)![1]) : undefined
  }

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
    lines = removeLinesEnding(lines, C.ENCHANT_LINE)
  } else if (lines.some(line => line.endsWith(C.IMPLICIT_LINE))) {
    modType = ModifierType.Implicit
    lines = removeLinesEnding(lines, C.IMPLICIT_LINE)
  } else if (lines.some(line => line.endsWith(C.FRACTURED_LINE))) {
    modType = ModifierType.Fractured
    lines = removeLinesEnding(lines, C.FRACTURED_LINE)
  } else if (lines.some(line => line.endsWith(C.CRAFTED_LINE))) {
    modType = ModifierType.Crafted
    lines = removeLinesEnding(lines, C.CRAFTED_LINE)
  } else {
    modType = ModifierType.Explicit
  }

  return { modType, lines }
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

      const dbStatA = STAT_BY_MATCH_STR.get(statA.translation.string)!.stat

      const toMerge = mods
        .reduce((filtered, modB) => {
          if (modB.info.type === modA.info.type) {
            const targetStat = modB.stats.find(statB =>
              dbStatA.stat.matchers.some(matcher => matcher.string === statB.translation.string)
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
        // TODO: for some stats reduced is better (m.negate === true)
        const translation = (statA.roll && Math.sign(statA.roll.min) !== Math.sign(statA.roll.max))
          ? dbStatA.stat.matchers.find(m => m.value == null && !m.negate)!
          : statA.translation

        out.push({
          stat: dbStatA.stat,
          trade: dbStatA.trade,
          string: translation.string,
          type: modA.info.type,
          corrupted: (modA.info.generation === 'corrupted') || undefined,
          negate: translation.negate,
          value: statA.roll?.value,
          bounds: statA.roll && { min: statA.roll.min, max: statA.roll.max }
        })
      } else {
        const roll = toMerge.reduce((sum, { stat }) => {
          sum.value += stat.roll!.value
          sum.min += stat.roll!.min
          sum.max += stat.roll!.max
          return sum
        }, { value: 0, min: 0, max: 0 })

        const sameSign = (Math.sign(roll.min) === Math.sign(roll.max))

        // TODO: for some stats reduced is better (m.negate === true)
        const translation =
          (dbStatA.stat.matchers.find(m => m.value === roll.value)) ??
          ((sameSign && statA.translation.value == null)
            ? statA.translation
            : dbStatA.stat.matchers.find(m => m.value == null && !m.negate)) ??
          ({ string: `Report bug if you see this text (${statA.translation.string})` })

        out.push({
          stat: dbStatA.stat,
          trade: dbStatA.trade,
          string: translation.string,
          type: modA.info.type,
          corrupted: (modA.info.generation === 'corrupted') || undefined,
          negate: translation.negate,
          value: roll.value,
          bounds: {
            min: roll.min,
            max: roll.max
          }
        })
      }

      merged.push(...toMerge.map(mod => mod.stat))
    }
  }

  return out
}
