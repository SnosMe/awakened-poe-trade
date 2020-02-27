import { STAT_BY_TEXT } from '@/data'
import { ItemModifier } from '@/components/parser/modifiers'

export function pseudoStat (text: string) {
  const mod = STAT_BY_TEXT.get(text)!

  return {
    text: mod.text,
    type: 'pseudo',
    tradeId: mod.types.find(t => t.name === 'pseudo')!.tradeId as string
  }
}

export function sumPseudoStats (modifiers: ItemModifier[], stats: string[]): number | undefined {
  return modifiers.reduce((res, mod) => stats.includes(mod.modInfo.text)
    ? (res || 0) + mod.values![0]
    : res, undefined as number | undefined)
}
