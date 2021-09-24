// import { UniqueItem, UNIQUES } from '@/assets/data'
import type { ParsedItem } from '@/parser'
import type { ItemModifier } from '@/parser/modifiers'
import type { StatFilter } from './interfaces'
import { percentRollDelta } from './util'

export function uniqueModFilterPartial (
  _item: ParsedItem,
  mod: ItemModifier,
  filter: Writeable<StatFilter>,
  percent: number
): void {
  // const uniqueInfo = UNIQUES.get(`${item.name} ${item.baseType!}`)

  // TODO set this info again: filter.variant = modInfo.variant

  if (!mod.bounds || (mod.bounds.min === mod.bounds.max)) {
    // TODO: add exceptions to (!mod.bounds) for items like sythesized rings, watcher's eye, unqiues with variants, etc.

    filter.defaultMin = mod.value
    filter.defaultMax = mod.value
    filter.min = filter.defaultMin
    filter.max = filter.defaultMax
    filter.roll = mod.value
    if (!filter.variant && !filter.corrupted) {
      filter.hidden = 'Roll is not variable'
    }
  } else {
    filter.boundMin = mod.bounds.min
    filter.boundMax = mod.bounds.max

    filter.roll = mod.value!
    filter.defaultMin = Math.max(percentRollDelta(mod.value!, (filter.boundMax - filter.boundMin), -percent, Math.floor), filter.boundMin)
    filter.defaultMax = Math.min(percentRollDelta(mod.value!, (filter.boundMax - filter.boundMin), +percent, Math.ceil), filter.boundMax)
  }
}
