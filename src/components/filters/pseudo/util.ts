import { STAT_BY_TEXT } from '@/data'

export function pseudoStat (text: string) {
  const mod = STAT_BY_TEXT.get(text)!

  return {
    text: mod.text,
    type: 'pseudo',
    tradeId: mod.types.find(t => t.name === 'pseudo')!.tradeId as string
  }
}
