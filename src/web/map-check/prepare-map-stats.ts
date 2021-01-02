import { ParsedItem } from '@/parser/ParsedItem'
import { getRollAsSingleNumber } from '@/parser/utils'

type PreparedStat = {
  text: string
  matchRef: string
  roll?: number
}

export function prepareMapStats (item: ParsedItem): PreparedStat[] {
  return item.modifiers.map(mod => {
    const prepared = {
      text: mod.string,
      matchRef: mod.string,
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
