import { ParsedItem } from '@/parser/ParsedItem'
import { getRollAsSingleNumber } from '@/parser/utils'

export interface PreparedStat {
  matcher: string
  roll?: number
}

export function prepareMapStats (item: ParsedItem): PreparedStat[] {
  return item.modifiers.map(mod => {
    const prepared = {
      matcher: mod.string,
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
