import { STAT_BY_REF } from '@/assets/data'
import { ItemModifier } from '@/parser/modifiers'

export function pseudoStat (ref: string) {
  const stat = STAT_BY_REF.get(ref)!

  return {
    text: stat.text,
    type: 'pseudo',
    tradeId: stat.types.find(t => t.name === 'pseudo')!.tradeId
  }
}

export function sumPseudoStats (modifiers: ItemModifier[], stats: string[]): number | undefined {
  return modifiers.reduce((res, mod) => stats.includes(mod.stat.ref)
    ? (res || 0) + mod.values![0]
    : res, undefined as number | undefined)
}
