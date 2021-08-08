// import { UniqueItem, UNIQUES } from '@/assets/data'
import { ParsedItem } from '@/parser'
import { ItemModifier } from '@/parser/modifiers'
import { percentRollDelta } from './util'
import { StatFilter } from './interfaces'
import { Config } from '@/web/Config'

export function uniqueModFilterPartial (
  _item: ParsedItem,
  mod: ItemModifier,
  filter: Writeable<StatFilter>
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
    const percent = Config.store.searchStatRange * 2
    filter.defaultMin = Math.max(percentRollDelta(mod.value!, (filter.boundMax - filter.boundMin), -percent, Math.floor), filter.boundMin)
    filter.defaultMax = Math.min(percentRollDelta(mod.value!, (filter.boundMax - filter.boundMin), +percent, Math.ceil), filter.boundMax)
  }
}
