import { UniqueItem, Uniques } from '../../data'
import { ParsedItem } from '../parser'
import { ItemModifier } from '../parser/modifiers'
import { getRollAsSingleNumber, percentRollDelta } from './util'
import { StatFilter } from './interfaces'

function isConstantMod (mod: UniqueItem['mods'][0]) {
  return mod.bounds.every(b => b.min === b.max)
}

function isWithinBounds (values: number[], { bounds }: UniqueItem['mods'][0]) {
  return values.every((value, idx) => (
    bounds[idx] !== undefined &&
    value >= bounds[idx].min &&
    value <= bounds[idx].max
  ))
}

export function uniqueModFilterPartial (
  item: ParsedItem,
  mod: ItemModifier,
  filter: Writeable<StatFilter>
): boolean {
  const uniqueInfo = Uniques.get(`${item.name} ${item.baseType}`)
  if (!uniqueInfo) return false

  const modInfo = uniqueInfo.mods.find(m =>
    m.text === mod.modInfo.text &&
    m.implicit === (mod.type === 'implicit' ? true : undefined)
  )
  if (!modInfo) return false

  filter.variant = modInfo.variant

  // use fallback
  if (mod.option) return false

  // trick: mod.values = mod.condition
  if (
    !mod.values &&
    mod.condition &&
    mod.condition.min === mod.condition.max &&
    !isConstantMod(modInfo) &&
    isWithinBounds([mod.condition.min!], modInfo)
  ) {
    mod.values = [mod.condition.min!]
  }

  if (!mod.values || (isConstantMod(modInfo) && isWithinBounds(mod.values, modInfo))) {
    filter.min = getRollAsSingleNumber(modInfo.bounds.map(b => b.min))
    filter.max = getRollAsSingleNumber(modInfo.bounds.map(b => b.max))
    filter.defaultMin = filter.min
    filter.defaultMax = filter.max
    if (!filter.variant) {
      filter.hidden = 'Roll is not variable'
    }
  } else {
    // it may be catalysts or stale data after patch
    if (!isWithinBounds(mod.values, modInfo)) return false

    filter.boundMin = getRollAsSingleNumber(modInfo.bounds.map(b => b.min))
    filter.boundMax = getRollAsSingleNumber(modInfo.bounds.map(b => b.max))

    const roll = getRollAsSingleNumber(mod.values)
    filter.roll = roll
    filter.defaultMin = Math.max(percentRollDelta(roll, (filter.boundMax - filter.boundMin), -20, Math.floor), filter.boundMin)
    filter.defaultMax = Math.min(percentRollDelta(roll, (filter.boundMax - filter.boundMin), +20, Math.ceil), filter.boundMax)
    filter.min = filter.defaultMin
    filter.max = filter.defaultMax
  }

  return true
}
