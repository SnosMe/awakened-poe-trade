import { createFilters } from './create-item-filters'
import { createExactStatFilters, initUiModFilters } from './create-stat-filters'
import { ModifierType, sumStatsByModType } from '@/parser/modifiers'
import { ItemCategory, ItemRarity, ParsedItem } from '@/parser'
import type { FilterPreset } from './interfaces'

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V']

export function createPresets (
  item: ParsedItem,
  opts: {
    league: string
    currency: string | undefined
    collapseListings: 'app' | 'api'
    activateStockFilter: boolean
    searchStatRange: number
    useEn: boolean
  }
): { presets: FilterPreset[], active: string } {
  if (item.info.refName === 'Expedition Logbook') {
    return {
      active: ROMAN_NUMERALS[0],
      presets: item.logbookAreaMods!.map<FilterPreset>((area, idx) => ({
        id: ROMAN_NUMERALS[idx],
        filters: createFilters(item, { ...opts, exact: true }),
        stats: createExactStatFilters(item, sumStatsByModType(area), opts)
      }))
    }
  }

  if (
    (!item.info.craftable && item.rarity !== ItemRarity.Unique) ||
    item.isUnidentified ||
    item.rarity === ItemRarity.Normal ||
    (item.category === ItemCategory.Flask && item.rarity !== ItemRarity.Unique) ||
    (item.category === ItemCategory.SanctumRelic && item.rarity !== ItemRarity.Unique) ||
    item.category === ItemCategory.Charm ||
    item.category === ItemCategory.Tincture ||
    item.category === ItemCategory.Map ||
    item.category === ItemCategory.MemoryLine ||
    item.category === ItemCategory.Invitation ||
    item.category === ItemCategory.HeistContract ||
    item.category === ItemCategory.HeistBlueprint ||
    item.category === ItemCategory.Sentinel
  ) {
    return {
      active: 'filters.preset_exact',
      presets: [{
        id: 'filters.preset_exact',
        filters: createFilters(item, { ...opts, exact: true }),
        stats: createExactStatFilters(item, item.statsByType, opts)
      }]
    }
  }

  const pseudoPreset: FilterPreset = {
    id: 'filters.preset_pseudo',
    filters: createFilters(item, { ...opts, exact: false }),
    stats: initUiModFilters(item, opts)
  }

  const likelyFinishedItem = (
    item.rarity === ItemRarity.Unique ||
    item.statsByType.some(calc => calc.type === ModifierType.Crafted) ||
    item.quality === 20 || // quality > 20 can be used for selling bases, quality < 20 drops sometimes
    item.isCorrupted ||
    item.isMirrored
  )

  const hasCraftingValue = (
    item.isSynthesised ||
    item.isFractured ||
    item.influences.length ||
    item.category === ItemCategory.ClusterJewel ||
    (item.category === ItemCategory.Jewel && item.rarity === ItemRarity.Magic) ||
    (item.category !== ItemCategory.Jewel &&
      item.category !== ItemCategory.AbyssJewel &&
      item.itemLevel! >= 82)
  )

  if (likelyFinishedItem || !hasCraftingValue) {
    return { active: pseudoPreset.id, presets: [pseudoPreset] }
  }

  const baseItemPreset: FilterPreset = {
    id: 'filters.preset_base_item',
    filters: createFilters(item, { ...opts, exact: true }),
    stats: createExactStatFilters(item, item.statsByType, opts)
  }

  return {
    active: pseudoPreset.id,
    presets: [pseudoPreset, baseItemPreset]
  }
}
