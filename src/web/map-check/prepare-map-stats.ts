import { ParsedItem } from '@/parser/ParsedItem'
import { percentRoll } from '../price-check/filters/util'

export interface PreparedStat {
  matcher: string
  roll?: number
}

export function prepareMapStats (item: ParsedItem): PreparedStat[] {
  return item.modifiers.map(mod => {
    const prepared = {
      matcher: mod.string,
      roll: mod.value && percentRoll(mod.value, 0, Math.floor, mod.stat.dp)
    }

    if (mod.negate) {
      if (prepared.roll != null) {
        prepared.roll = -1 * prepared.roll
      }
    }

    return prepared
  })
}
