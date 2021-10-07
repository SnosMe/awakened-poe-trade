import { statSourcesTotal, translateStatWithRoll } from '@/parser/modifiers'
import { ParsedItem } from '@/parser/ParsedItem'
import { percentRoll } from '../price-check/filters/util'

export interface PreparedStat {
  matcher: string
  roll?: number
}

export function prepareMapStats (item: ParsedItem): PreparedStat[] {
  return item.statsByType.map(calc => {
    const roll = statSourcesTotal(calc)
    const translation = translateStatWithRoll(calc, roll)

    const prepared = {
      matcher: translation.string,
      roll: roll && percentRoll(roll.value, 0, Math.floor, translation.dp)
    }

    if (translation.negate) {
      if (prepared.roll != null) {
        prepared.roll = -1 * prepared.roll
      }
    }

    return prepared
  })
}
