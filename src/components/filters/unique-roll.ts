import { UniqueItem, Uniques } from '../../data'
import { ParsedItem } from '../parser'
import { ItemModifier } from '../parser/modifiers'
import { getRollAsSingleNumber, percentRollDelta } from './util'
import { StatFilter } from './interfaces'

function isConstantMod (mod: UniqueItem['mods'][0]) {
  return mod.bounds.every(b => b.min === b.max)
}

// NOTE: can mutate mod values to non-negated
function isWithinBounds (mod: ItemModifier, { bounds }: UniqueItem['mods'][0]): boolean {
  let isWithin = mod.values!.every((value, idx) => (
    bounds[idx] !== undefined &&
    value >= bounds[idx].min &&
    value <= bounds[idx].max
  ))

  if (!isWithin && mod.negatedValues) {
    const values = mod.values!.map(v => v * -1)
    isWithin = values.every((value, idx) => (
      bounds[idx] !== undefined &&
      value >= bounds[idx].min &&
      value <= bounds[idx].max
    ))
    if (isWithin) {
      mod.values = values
    }
  }
  return isWithin
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
    (
      modInfo.bounds[0] !== undefined &&
      mod.condition.min! >= modInfo.bounds[0].min &&
      mod.condition.min! <= modInfo.bounds[0].max
    )
  ) {
    mod.values = [mod.condition.min!]
  }

  if (!mod.values || (isConstantMod(modInfo) && isWithinBounds(mod, modInfo))) {
    filter.min = getRollAsSingleNumber(modInfo.bounds.map(b => b.min))
    filter.max = getRollAsSingleNumber(modInfo.bounds.map(b => b.max))
    filter.defaultMin = filter.min
    filter.defaultMax = filter.max
    if (!filter.variant) {
      filter.hidden = 'Roll is not variable'
    }
  } else {
    // it may be catalysts or stale data after patch
    if (!isWithinBounds(mod, modInfo)) return false

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
