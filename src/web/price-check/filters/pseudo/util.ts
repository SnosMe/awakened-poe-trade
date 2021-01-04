import { STAT_BY_REF } from '@/assets/data'
import { ItemModifier, ModifierType } from '@/parser/modifiers'
import { INTERNAL_TRADE_ID } from '../interfaces'

export function pseudoStat (ref: string) {
  const stat = STAT_BY_REF.get(ref)!

  return {
    text: (stat.stat.matchers.find(m => !m.negate) || stat.stat.matchers[0]).string,
    statRef: stat.stat.ref,
    type: 'pseudo',
    tradeId: stat.trade.ids[ModifierType.Pseudo]
  }
}

export function internalPropStat (tradeId: INTERNAL_TRADE_ID, text: string, type: 'armour' | 'weapon') {
  return {
    text,
    statRef: text,
    type,
    tradeId: [tradeId]
  }
}

export function sumPseudoStats (modifiers: ItemModifier[], stats: string[]): number | undefined {
  return modifiers.reduce((res, mod) => stats.includes(mod.stat.ref)
    ? (res || 0) + mod.values![0]
    : res, undefined as number | undefined)
}
