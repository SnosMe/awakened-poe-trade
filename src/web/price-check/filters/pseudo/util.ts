import { STAT_BY_REF } from '@/assets/data'
import { StatCalculated, ModifierType } from '@/parser/modifiers'
import { FilterTag, InternalTradeId } from '../interfaces'

export function pseudoStat (ref: string) {
  const stat = STAT_BY_REF.get(ref)!

  return {
    text: (stat.matchers.find(m => !m.negate) || stat.matchers[0]).string,
    statRef: stat.ref,
    tag: FilterTag.Pseudo,
    tradeId: stat.trade.ids[ModifierType.Pseudo]
  }
}

export function internalPropStat (tradeId: InternalTradeId, text: string, type: 'armour' | 'weapon') {
  return {
    text,
    statRef: text,
    tag: FilterTag.Property,
    tradeId: [tradeId]
  }
}

export function sumPseudoStats (stats: StatCalculated[], pseudoRefs: string[]) {
  return stats.reduce<number | undefined>(
    (total, { stat, sources }) =>
      pseudoRefs.includes(stat.ref)
        ? (total ?? 0) + sources.reduce((total, source) => total + source.contributes!.value, 0)
        : total,
    undefined)
}
