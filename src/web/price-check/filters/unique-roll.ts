// import { UniqueItem, UNIQUES } from '@/assets/data'
import type { ParsedItem } from '@/parser'
import type { StatRoll } from '@/parser/modifiers'
import { FilterTag, StatFilter } from './interfaces'
import { percentRollDelta } from './util'

export function uniqueModFilterPartial (
  _item: ParsedItem,
  statRoll: StatRoll,
  filter: StatFilter,
  percent: number,
  dp: boolean
): void {
  // const uniqueInfo = UNIQUES.get(`${item.name} ${item.baseType!}`)

  // TODO set this info again and uncomment line
  // filter.variant = modInfo.variant

  if (statRoll.min === statRoll.max) {
    // TODO: add exceptions to (!mod.bounds) for items like sythesized rings, watcher's eye, unqiues with variants, etc.

    filter.roll = {
      value: statRoll.value,
      min: statRoll.value,
      max: statRoll.value,
      default: {
        min: statRoll.value,
        max: statRoll.value
      },
      step: dp ? 0.01 : 1
    }

    if (filter.tag !== FilterTag.Variant && filter.tag !== FilterTag.Corrupted) {
      filter.hidden = 'Roll is not variable'
    }
  } else {
    filter.roll = {
      value: statRoll.value,
      min: undefined,
      max: undefined,
      default: {
        min: Math.max(percentRollDelta(statRoll.value, (statRoll.max - statRoll.min), -percent, Math.floor, dp), statRoll.min),
        max: Math.min(percentRollDelta(statRoll.value, (statRoll.max - statRoll.min), +percent, Math.ceil, dp), statRoll.max)
      },
      bounds: {
        min: statRoll.min,
        max: statRoll.max
      },
      step: dp ? 0.01 : 1
    }
  }
}
