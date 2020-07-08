import { UniqueItem, UNIQUES } from '@/assets/data'
import { ParsedItem } from '@/parser'
import { ItemModifier } from '@/parser/modifiers'
import { percentRollDelta } from './util'
import { StatFilter } from './interfaces'
import { getRollAsSingleNumber } from '@/parser/utils'
import { Config } from '@/web/Config'

function isConstantMod (mod: UniqueItem['stats'][0]) {
  return mod.bounds.every(b => b.min === b.max)
}

function isWithinBounds (mod: ItemModifier, { bounds }: UniqueItem['stats'][0]): boolean {
  return mod.values!.every((value, idx) => (
    bounds[idx] !== undefined &&
    value >= bounds[idx].min &&
    value <= bounds[idx].max
  ))
}

export function uniqueModFilterPartial (
  item: ParsedItem,
  mod: ItemModifier,
  filter: Writeable<StatFilter>
): void {
  const uniqueInfo = UNIQUES.get(`${item.name} ${item.baseType}`)
  if (!uniqueInfo) return fallbackToExact(mod, filter)

  const modInfo = uniqueInfo.stats.find(stat =>
    stat.text === mod.stat.ref &&
    stat.implicit === (mod.type === 'implicit' ? true : undefined)
  )
  if (!modInfo) return fallbackToExact(mod, filter)

  filter.variant = modInfo.variant

  // trick: mod.values = modInfo.bounds
  if (!mod.values) {
    mod.values = modInfo.bounds.map(b => getRollAsSingleNumber([b.min, b.max]))
  }

  // it may be catalysts or stale data after patch
  if (!isWithinBounds(mod, modInfo)) return fallbackToExact(mod, filter)

  if (isConstantMod(modInfo)) {
    filter.defaultMin = getRollAsSingleNumber(mod.values)
    filter.defaultMax = getRollAsSingleNumber(mod.values)
    filter.min = filter.defaultMin
    filter.max = filter.defaultMax
    filter.roll = getRollAsSingleNumber(mod.values)
    if (!filter.variant) {
      filter.hidden = 'Roll is not variable'
    }
  } else {
    filter.boundMin = getRollAsSingleNumber(modInfo.bounds.map(b => b.min))
    filter.boundMax = getRollAsSingleNumber(modInfo.bounds.map(b => b.max))

    const roll = getRollAsSingleNumber(mod.values)
    filter.roll = roll
    const percent = Config.store.searchStatRange * 2
    filter.defaultMin = Math.max(percentRollDelta(roll, (filter.boundMax - filter.boundMin), -percent, Math.floor), filter.boundMin)
    filter.defaultMax = Math.min(percentRollDelta(roll, (filter.boundMax - filter.boundMin), +percent, Math.ceil), filter.boundMax)
  }
}

function fallbackToExact (mod: ItemModifier, filter: Writeable<StatFilter>) {
  if (!mod.values) {
    if (mod.condition) {
      filter.min = mod.condition.min
      filter.max = mod.condition.max
      filter.defaultMin = filter.min
      filter.defaultMax = filter.max
      filter.roll = filter.min || filter.max
    }
  } else {
    filter.roll = getRollAsSingleNumber(mod.values)
    filter.defaultMin = filter.roll
    filter.defaultMax = filter.roll
  }
}
