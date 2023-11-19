import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { ModifierType, StatCalculated, statSourcesTotal, translateStatWithRoll } from '@/parser/modifiers'
import { percentRoll, percentRollDelta, roundRoll } from './util'
import { FilterTag, ItemHasEmptyModifier, StatFilter } from './interfaces'
import { filterPseudo } from './pseudo'
import { applyRules as applyAtzoatlRules } from './pseudo/atzoatl-rules'
import { applyRules as applyMirroredTabletRules } from './pseudo/reflection-rules'
import { filterItemProp, filterBasePercentile } from './pseudo/item-property'
import { decodeOils, applyAnointmentRules } from './pseudo/anointments'
import { StatBetter, CLIENT_STRINGS } from '@/assets/data'

export interface FiltersCreationContext {
  readonly item: ParsedItem
  readonly searchInRange: number
  filters: StatFilter[]
  statsByType: StatCalculated[]
}

export function createExactStatFilters (
  item: ParsedItem,
  statsByType: StatCalculated[],
  opts: { searchStatRange: number }
): StatFilter[] {
  if (
    item.mapBlighted ||
    item.category === ItemCategory.Invitation
  ) return []
  if (
    item.isUnidentified &&
    item.rarity === ItemRarity.Unique &&
    !item.isSynthesised
  ) return []

  const keepByType = [ModifierType.Pseudo, ModifierType.Fractured, ModifierType.Enchant]

  if (
    !item.influences.length &&
    !item.isFractured
  ) {
    keepByType.push(ModifierType.Implicit)
  }

  if (item.rarity === ItemRarity.Magic && (
    item.category !== ItemCategory.ClusterJewel &&
    item.category !== ItemCategory.Map &&
    item.category !== ItemCategory.HeistContract &&
    item.category !== ItemCategory.HeistBlueprint &&
    item.category !== ItemCategory.Sentinel
  )) {
    keepByType.push(ModifierType.Explicit)
  }

  if (item.category === ItemCategory.Flask) {
    keepByType.push(ModifierType.Crafted)
  }

  const ctx: FiltersCreationContext = {
    item,
    searchInRange: Math.min(2, opts.searchStatRange),
    filters: [],
    statsByType: statsByType.filter(calc => keepByType.includes(calc.type))
  }

  filterBasePercentile(ctx)

  ctx.filters.push(
    ...ctx.statsByType.map(mod => calculatedStatToFilter(mod, ctx.searchInRange, item))
  )

  if (item.info.refName === 'Chronicle of Atzoatl') {
    applyAtzoatlRules(ctx.filters)
    return ctx.filters
  }
  if (item.info.refName === 'Mirrored Tablet') {
    applyMirroredTabletRules(ctx.filters)
    return ctx.filters
  }

  for (const filter of ctx.filters) {
    filter.hidden = undefined

    if (filter.tag === FilterTag.Explicit) {
      filter.disabled = !filter.sources.some(source =>
        source.modifier.info.tier != null &&
        source.modifier.info.tier <= 2
      )
    } else if (filter.tag !== FilterTag.Property) {
      filter.disabled = false
    }

    if (filter.statRef === '# uses remaining') {
      filter.roll!.min = filter.roll!.value
      filter.roll!.default.min = filter.roll!.value
      filter.roll!.default.max = filter.roll!.value
    }
  }

  if (item.category === ItemCategory.ClusterJewel) {
    applyClusterJewelRules(ctx.filters)
  } else if (item.category === ItemCategory.Flask) {
    applyFlaskRules(ctx.filters)
  } else if (
    item.category === ItemCategory.MemoryLine ||
    item.category === ItemCategory.SanctumRelic
  ) {
    enableAllFilters(ctx.filters)
  }

  return ctx.filters
}

export function initUiModFilters (
  item: ParsedItem,
  opts: {
    searchStatRange: number
  }
): StatFilter[] {
  const ctx: FiltersCreationContext = {
    item,
    filters: [],
    searchInRange: (item.rarity === ItemRarity.Normal || item.rarity === ItemRarity.Magic)
      ? 100 // only care about Tier
      : opts.searchStatRange,
    statsByType: item.statsByType.map(calc => {
      if (calc.type === ModifierType.Fractured && calc.stat.trade.ids[ModifierType.Explicit]) {
        return { ...calc, type: ModifierType.Explicit }
      } else {
        return calc
      }
    })
  }

  if (item.info.refName !== 'Split Personality') {
    filterItemProp(ctx)
    filterPseudo(ctx)
    if (item.info.refName === "Emperor's Vigilance") {
      filterBasePercentile(ctx)
    }
  }

  if (!item.isCorrupted && !item.isMirrored) {
    ctx.statsByType = ctx.statsByType.filter(mod => mod.type !== ModifierType.Fractured)
    ctx.statsByType.push(...item.statsByType.filter(mod => mod.type === ModifierType.Fractured))
  }

  if (item.isVeiled) {
    ctx.statsByType = ctx.statsByType.filter(mod => mod.type !== ModifierType.Veiled)
  }

  ctx.filters.push(
    ...ctx.statsByType.map(mod => calculatedStatToFilter(mod, ctx.searchInRange, item))
  )

  if (item.isVeiled) {
    ctx.filters.forEach(filter => { filter.disabled = true })
  }

  finalFilterTweaks(ctx)

  return ctx.filters
}

export function calculatedStatToFilter (
  calc: StatCalculated,
  percent: number,
  item: ParsedItem
): StatFilter {
  const { stat, sources, type } = calc
  let filter: StatFilter

  if (stat.trade.option) {
    filter = {
      tradeId: stat.trade.ids[type],
      statRef: stat.ref,
      text: sources[0].stat.translation.string,
      tag: (type === ModifierType.Enchant)
        ? FilterTag.Enchant
        : FilterTag.Variant,
      oils: decodeOils(calc),
      sources: sources,
      option: {
        value: sources[0].contributes!.value
      },
      disabled: false
    }
  }

  const roll = statSourcesTotal(
    calc.sources,
    (item.info.refName === 'Mirrored Tablet') ? 'max' : 'sum'
  )
  const translation = translateStatWithRoll(calc, roll)

  filter ??= {
    tradeId: stat.trade.ids[type],
    statRef: stat.ref,
    text: translation.string,
    tag: (type as unknown) as FilterTag,
    oils: decodeOils(calc),
    sources: sources,
    roll: undefined,
    disabled: true
  }

  if (type === ModifierType.Implicit) {
    if (sources.some(s => s.modifier.info.generation === 'corrupted')) {
      filter.tag = FilterTag.Corrupted
    } else if (sources.some(s => s.modifier.info.generation === 'eldritch')) {
      filter.tag = FilterTag.Eldritch
    } else if (item.isSynthesised) {
      filter.tag = FilterTag.Synthesised
    }
  } else if (type === ModifierType.Explicit) {
    if (item.info.unique?.fixedStats) {
      const fixedStats = item.info.unique.fixedStats
      if (!fixedStats.includes(filter.statRef)) {
        filter.tag = FilterTag.Variant
      }
    } else if (sources.some(s => CLIENT_STRINGS.SHAPER_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Shaper
    } else if (sources.some(s => CLIENT_STRINGS.ELDER_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Elder
    } else if (sources.some(s => CLIENT_STRINGS.HUNTER_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Hunter
    } else if (sources.some(s => CLIENT_STRINGS.WARLORD_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Warlord
    } else if (sources.some(s => CLIENT_STRINGS.REDEEMER_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Redeemer
    } else if (sources.some(s => CLIENT_STRINGS.CRUSADER_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Crusader
    } else if (sources.some(s => CLIENT_STRINGS.DELVE_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Delve
    } else if (sources.some(s => CLIENT_STRINGS.VEILED_MODS.includes(s.modifier.info.name!))) {
      // can't drop from ground, so don't show
      // filter.tag = FilterTag.Unveiled
    } else if (sources.some(s => CLIENT_STRINGS.INCURSION_MODS.includes(s.modifier.info.name!))) {
      filter.tag = FilterTag.Incursion
    }
  }

  if (roll && !filter.option) {
    if (
      item.rarity === ItemRarity.Unique ||
      calc.sources.some(({ modifier }) => modifier.info.tier === 1)
    ) {
      const perfectRoll = (
        (calc.stat.better === StatBetter.PositiveRoll && roll.value >= roll.max) ||
        (calc.stat.better === StatBetter.NegativeRoll && roll.value <= roll.min)
      )
      if (perfectRoll) {
        percent = 0
      }
    }

    const dp =
    calc.stat.dp ||
    calc.sources.some(s => s.stat.stat.ref === calc.stat.ref && s.stat.roll!.dp)

    const filterBounds = {
      min: percentRoll(roll.min, -0, Math.floor, dp),
      max: percentRoll(roll.max, +0, Math.ceil, dp)
    }

    const filterDefault = (calc.stat.better === StatBetter.NotComparable)
      ? { min: roll.value, max: roll.value }
      : (item.rarity === ItemRarity.Unique)
          ? {
              min: percentRollDelta(roll.value, (roll.max - roll.min), -percent, Math.floor, dp),
              max: percentRollDelta(roll.value, (roll.max - roll.min), +percent, Math.ceil, dp)
            }
          : {
              min: percentRoll(roll.value, -percent, Math.floor, dp),
              max: percentRoll(roll.value, +percent, Math.ceil, dp)
            }
    filterDefault.min = Math.max(filterDefault.min, filterBounds.min)
    filterDefault.max = Math.min(filterDefault.max, filterBounds.max)

    filter.roll = {
      value: roundRoll(roll.value, dp),
      min: undefined,
      max: undefined,
      default: filterDefault,
      bounds: (item.rarity === ItemRarity.Unique && roll.min !== roll.max && calc.stat.better !== StatBetter.NotComparable)
        ? filterBounds
        : undefined,
      dp: dp,
      isNegated: false,
      tradeInvert: calc.stat.trade.inverted
    }

    filterFillMinMax(filter.roll, calc.stat.better)

    if (translation.negate) {
      filterAdjustmentForNegate(filter.roll)
    }
  }

  hideNotVariableStat(filter, item)

  return filter
}

function hideNotVariableStat (filter: StatFilter, item: ParsedItem) {
  if (item.rarity !== ItemRarity.Unique) return
  if (filter.tag === FilterTag.Implicit &&
    item.category === ItemCategory.Jewel) return
  if (
    filter.tag !== FilterTag.Implicit &&
    filter.tag !== FilterTag.Explicit &&
    filter.tag !== FilterTag.Pseudo
  ) return

  if (!filter.roll) {
    filter.hidden = 'filters.hide_const_roll'
  } else if (!filter.roll.bounds) {
    filter.roll.min = undefined
    filter.roll.max = undefined
    filter.hidden = 'filters.hide_const_roll'
  }
}

function filterFillMinMax (
  roll: NonNullable<StatFilter['roll']>,
  better: StatBetter
) {
  switch (better) {
    case StatBetter.PositiveRoll:
      roll.min = roll.default.min
      break
    case StatBetter.NegativeRoll:
      roll.max = roll.default.max
      break
    case StatBetter.NotComparable:
      roll.min = roll.default.min
      roll.max = roll.default.max
      break
  }
}

function filterAdjustmentForNegate (
  roll: NonNullable<StatFilter['roll']>
) {
  roll.tradeInvert = !roll.tradeInvert
  roll.isNegated = true
  const swap = JSON.parse(JSON.stringify(roll)) as typeof roll

  if (swap.bounds && roll.bounds) {
    roll.bounds.min = -1 * swap.bounds.max
    roll.bounds.max = -1 * swap.bounds.min
  }

  roll.default.min = -1 * swap.default.max
  roll.default.max = -1 * swap.default.min

  roll.value = -1 * swap.value
  roll.min = (typeof swap.max === 'number')
    ? -1 * swap.max
    : undefined
  roll.max = (typeof swap.min === 'number')
    ? -1 * swap.min
    : undefined
}

function finalFilterTweaks (ctx: FiltersCreationContext) {
  const { item } = ctx

  if (item.category === ItemCategory.ClusterJewel && item.rarity !== ItemRarity.Unique) {
    applyClusterJewelRules(ctx.filters)
  } else if (item.category === ItemCategory.Flask) {
    applyFlaskRules(ctx.filters)
  }

  const hasEmptyModifier = showHasEmptyModifier(ctx)
  if (hasEmptyModifier !== false) {
    ctx.filters.push({
      tradeId: ['item.has_empty_modifier'],
      text: '1 Empty or Crafted Modifier',
      statRef: '1 Empty or Crafted Modifier',
      disabled: true,
      hidden: 'filters.hide_empty_mod',
      tag: FilterTag.Pseudo,
      sources: [],
      option: {
        value: hasEmptyModifier
      }
    })
  }

  if (item.category === ItemCategory.Amulet || item.category === ItemCategory.Ring) {
    applyAnointmentRules(ctx.filters, ctx.item)
  }

  for (const filter of ctx.filters) {
    if (filter.tag === FilterTag.Fractured) {
      const mod = ctx.item.statsByType.find(mod => mod.stat.ref === filter.statRef)!
      if (mod.stat.trade.ids[ModifierType.Explicit]) {
        // hide only if fractured mod has corresponding explicit variant
        filter.hidden = 'filters.hide_for_crafting'
      }
    }
  }

  if (item.rarity === ItemRarity.Unique) {
    const countVisible = ctx.filters.reduce((cnt, filter) => filter.hidden ? cnt : cnt + 1, 0)
    if (countVisible <= 3) {
      enableAllFilters(ctx.filters)
    }
  }
}

function applyClusterJewelRules (filters: StatFilter[]) {
  for (const filter of filters) {
    if (filter.statRef === '# Added Passive Skills are Jewel Sockets') {
      filter.hidden = 'filters.hide_const_roll'
      filter.disabled = true
    }

    // https://www.poewiki.net/wiki/Cluster_Jewel#Optimal_passive_skill_amounts
    if (filter.statRef === 'Adds # Passive Skills') {
      filter.disabled = false

      // 4 is [_, 5]
      if (filter.roll!.value === 4) {
        filter.roll!.max = 5
      // 5 is [5, 5]
      } else if (filter.roll!.value === 5) {
        filter.roll!.min = filter.roll!.default.min
      // 3, 6, 10, 11, 12 are [n, _]
      } else if (
        filter.roll!.value === 3 ||
        filter.roll!.value === 6 ||
        filter.roll!.value === 10 ||
        filter.roll!.value === 11 ||
        filter.roll!.value === 12
      ) {
        filter.roll!.min = filter.roll!.default.min
        filter.roll!.max = undefined
      }
      // else 2, 8, 9 are [_ , n]
    }
  }
}

function applyFlaskRules (filters: StatFilter[]) {
  const usedEnkindling = filters.find(filter => filter.statRef === 'Gains no Charges during Flask Effect')
  for (const filter of filters) {
    if (filter.tag === FilterTag.Enchant && !usedEnkindling) {
      filter.hidden = 'hide_harvest_and_instilling'
      filter.disabled = true
    }
  }
}

// TODO
// +1 Prefix Modifier allowed
// -1 Suffix Modifier allowed
function showHasEmptyModifier (ctx: FiltersCreationContext): ItemHasEmptyModifier | false {
  const { item } = ctx

  if (
    item.rarity !== ItemRarity.Rare ||
    item.isCorrupted ||
    item.isMirrored
  ) return false

  const randomMods = item.newMods.filter(mod =>
    mod.info.type === ModifierType.Explicit ||
    mod.info.type === ModifierType.Fractured ||
    mod.info.type === ModifierType.Veiled ||
    mod.info.type === ModifierType.Crafted)

  const craftedMod = randomMods.find(mod => mod.info.type === ModifierType.Crafted)

  if (
    (randomMods.length === 5 && !craftedMod) ||
    (randomMods.length === 6 && craftedMod)
  ) {
    let prefixes = randomMods.filter(mod => mod.info.generation === 'prefix').length
    let suffixes = randomMods.filter(mod => mod.info.generation === 'suffix').length

    if (craftedMod) {
      if (craftedMod.info.generation === 'prefix') {
        prefixes -= 1
      } else {
        suffixes -= 1
      }
    }

    if (prefixes === 2) return ItemHasEmptyModifier.Prefix
    if (suffixes === 2) return ItemHasEmptyModifier.Suffix
  }

  return false
}

function enableAllFilters (filters: StatFilter[]) {
  for (const filter of filters) {
    if (!filter.hidden) {
      filter.disabled = false
    }
  }
}
