import { ParsedItem } from '@/parser/ParsedItem'
import { getRollAsSingleNumber } from '@/parser/utils'

type PreparedStat = {
  text: string
  ref: string
  roll?: number
}

export function prepareMapStats (item: ParsedItem): PreparedStat[] {
  return item.modifiers.map(mod => {
    const prepared = {
      text: mod.string,
      ref: mod.stat.ref,
      roll: mod.values && getRollAsSingleNumber(mod.values)
    }

    if (mod.negate) {
      if (prepared.roll != null) {
        prepared.roll = -1 * prepared.roll
      }
    }

    return prepared
  })
}
