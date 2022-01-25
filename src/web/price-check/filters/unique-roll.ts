import type { ParsedItem } from '@/parser'
import type { StatRoll } from '@/parser/modifiers'
import { FilterTag, StatFilter } from './interfaces'
import { percentRollDelta } from './util'

export function uniqueModFilterPartial (
  statRoll: StatRoll,
  filter: StatFilter,
  percent: number,
  dp: boolean
): void {
  if (statRoll.min === statRoll.max) {
    filter.roll = {
      value: statRoll.value,
      min: statRoll.value,
      max: statRoll.value,
      default: {
        min: statRoll.value,
        max: statRoll.value
      },
      dp: dp,
      isNegated: false
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
      dp: dp,
      isNegated: false
    }
  }
}

export function uniqueModFilterTweaks (
  item: ParsedItem,
  filter: StatFilter
): void {
  if (item.info.unique!.fixedStats) {
    const fixedStats = item.info.unique!.fixedStats
    if (!fixedStats.includes(filter.statRef)) {
      filter.tag = FilterTag.Variant
    }
  }

  if (
    !filter.roll?.bounds &&
    filter.tag !== FilterTag.Variant &&
    filter.tag !== FilterTag.Corrupted
  ) {
    filter.hidden = 'Roll is not variable'
  }
}
