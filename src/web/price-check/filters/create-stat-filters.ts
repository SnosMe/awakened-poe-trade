import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { ItemModifier, ModifierType } from '@/parser/modifiers'
import { uniqueModFilterPartial } from './unique-roll'
import { rollToFilter } from './util'
import { StatFilter } from './interfaces'
import { filterPseudo } from './pseudo'
import { filterItemProp } from './pseudo/item-property'
import { getRollAsSingleNumber } from '@/parser/utils'
import { filterUniqueItemProp } from './pseudo/item-property-unique'

export interface FiltersCreationContext {
  readonly item: ParsedItem
  filters: Writeable<StatFilter>[]
  modifiers: ParsedItem['modifiers']
}

export function initUiModFilters (item: ParsedItem): StatFilter[] {
  if (item.rarity === ItemRarity.Unique && item.category === ItemCategory.Map) {
    return []
  }

  const ctx: FiltersCreationContext = {
    item,
    filters: [],
    modifiers: [...item.modifiers]
  }

  if (!item.isUnidentified) {
    if (item.rarity === ItemRarity.Unique) {
      filterUniqueItemProp(ctx)
    } else {
      filterItemProp(ctx)
      filterPseudo(ctx)
    }
  }

  ctx.filters.push(
    ...ctx.modifiers.map(mod => itemModToFilter(mod, item))
  )

  if (item.isUnidentified && item.rarity === ItemRarity.Unique) {
    ctx.filters = ctx.filters.filter(f => !f.hidden)
  }

  if (item.extra.veiled) {
    ctx.filters.forEach(filter => { filter.disabled = true })
  }

  return ctx.filters
}

export function itemModToFilter (mod: ItemModifier, item: ParsedItem) {
  const filter: Writeable<StatFilter> = {
    tradeId: mod.stat.types.find(type => type.name === mod.type)!.tradeId,
    text: mod.stat.text,
    type: mod.type,
    option: mod.option,
    roll: undefined,
    disabled: true,
    min: undefined,
    max: undefined
  }
  if (mod.option) {
    return filter
  }

  if (
    item.rarity === ItemRarity.Unique &&
    mod.type !== ModifierType.Enchant
  ) {
    uniqueModFilterPartial(item, mod, filter)
  } else {
    itemModFilterPartial(mod, filter)
  }

  filterAdjustmentForNegate(mod, filter)

  return filter
}

function itemModFilterPartial (
  mod: ItemModifier,
  filter: Writeable<StatFilter>
) {
  if (
    !mod.values &&
    mod.condition &&
    (mod.condition.min === mod.condition.max) &&
    (mod.condition.min == null || mod.condition.max == null)
  ) {
    filter.min = mod.condition.min
    filter.max = mod.condition.max
    filter.defaultMin = filter.min
    filter.defaultMax = filter.max
    filter.roll = filter.min || filter.max
  } else if (mod.values) {
    if (mod.type === 'enchant') {
      filter.min = getRollAsSingleNumber(mod.values)
      filter.max = getRollAsSingleNumber(mod.values)
      filter.defaultMin = filter.min
      filter.defaultMax = filter.max
      filter.roll = filter.min
    } else {
      Object.assign(filter, rollToFilter(getRollAsSingleNumber(mod.values)))
    }
  }
}

function filterAdjustmentForNegate (
  mod: ItemModifier,
  filter: Writeable<StatFilter>
) {
  let negateFilter = false

  if (filter.boundMin != null && filter.boundMax != null) { // unique
    const sameSign = (Math.sign(filter.boundMin) === Math.sign(filter.boundMax))
    const isNegated = mod.negate
    const positiveMatcher = mod.statMatchers.find(matcher => matcher.negate !== isNegated)
    if (!sameSign && isNegated && positiveMatcher) {
      filter.text = positiveMatcher.string
    } else {
      filter.text = mod.string
      negateFilter = Boolean(mod.negate)
    }
  } else {
    filter.text = mod.string
    negateFilter = Boolean(mod.negate)
  }

  if (negateFilter) {
    filter.invert = true
    const raw = { ...filter }

    if (filter.boundMin != null && filter.boundMax != null) {
      filter.boundMin = -1 * raw.boundMax!
      filter.boundMax = -1 * raw.boundMin!
    }
    if (filter.defaultMin != null && filter.defaultMax != null) {
      filter.defaultMin = -1 * raw.defaultMax!
      filter.defaultMax = -1 * raw.defaultMin!
    }
    if (filter.min == null && filter.max == null && filter.defaultMax != null) {
      filter.min = -1 * (raw.defaultMax as number)
    } else {
      if (filter.max != null) {
        filter.min = -1 * (raw.max as number)
      }
      if (filter.min != null) {
        filter.max = -1 * (raw.min as number)
      }
    }
    if (filter.roll != null) {
      filter.roll = -1 * raw.roll!
    }
  } else {
    if (filter.min == null && filter.max == null && filter.defaultMin != null) {
      filter.min = filter.defaultMin
    }
  }

  if (mod.stat.inverted) {
    filter.invert = !filter.invert
  }
}
