import { applyIncr } from './advanced-mod-desc'
import type { Stat, StatMatcher } from '@/assets/data'
import type { ParsedModifier } from './advanced-mod-desc'
import type { ParsedStat } from './stat-translations'

export interface StatCalculated {
  stat: Stat
  type: ModifierType
  sources: Array<{
    modifier: ParsedModifier
    stat: ParsedStat
    contributes?: {
      value: number
      min: number
      max: number
    }
  }>
}

export function sumStatsByModType (mods: readonly ParsedModifier[]): StatCalculated[] {
  const out: StatCalculated[] = []

  for (const modA of mods) {
    for (const statA of modA.stats) {
      if (out.some(merged =>
        merged.stat.ref === statA.stat.ref &&
        merged.type === modA.info.type
      )) {
        continue
      }

      const sources = mods
        .reduce((filtered, modB) => {
          if (modB.info.type === modA.info.type) {
            const targetStat = modB.stats.find(statB =>
              statB.stat.ref === statA.stat.ref
            )
            if (targetStat) {
              const roll = (applyIncr(modB.info, targetStat) ?? targetStat).roll
              filtered.push({
                modifier: modB,
                stat: targetStat,
                contributes: roll && {
                  value: roll.value,
                  min: roll.min,
                  max: roll.max
                }
              })
            }
          }
          return filtered
        }, [] as StatCalculated['sources'])

      out.push({ stat: statA.stat, type: modA.info.type, sources })
    }
  }

  return out
}

export enum ModifierType {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Enchant = 'enchant',
  Veiled = 'veiled',
  Fractured = 'fractured'
}

export interface LegacyItemModifier extends
  Pick<StatMatcher, 'string' | 'negate'> {
  stat: Pick<Stat, 'ref' | 'trade' | 'dp' /* TODO remove `dp` */>
  value?: number
  bounds?: {
    min: number
    max: number
  }
  type: ModifierType
  corrupted?: true
}

export { LegacyItemModifier as ItemModifier }
