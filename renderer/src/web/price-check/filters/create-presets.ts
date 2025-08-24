import { createFilters } from "./create-item-filters";
import {
  createExactStatFilters,
  createResistanceWeightFilter,
  initUiModFilters,
  initWeightFilters,
} from "./create-stat-filters";
import { ModifierType, sumStatsByModType } from "@/parser/modifiers";
import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import type { FilterPreset } from "./interfaces";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { handleApplyItemEdits } from "./fill-runes";

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"];

export function createPresets(
  item: ParsedItem,
  opts: {
    league: string;
    currency: string | undefined;
    collapseListings: "app" | "api";
    activateStockFilter: boolean;
    searchStatRange: number;
    useEn: boolean;
    usePseudo: boolean;
    defaultAllSelected: boolean;
    autoFillEmptyRuneSockets: PriceCheckWidget["autoFillEmptyRuneSockets"];
  },
): { presets: FilterPreset[]; active: string } {
  if (item.info.refName === "Expedition Logbook") {
    return {
      active: ROMAN_NUMERALS[0],
      presets: item.logbookAreaMods!.map<FilterPreset>((area, idx) => ({
        id: ROMAN_NUMERALS[idx],
        filters: createFilters(item, { ...opts, exact: true }),
        stats: createExactStatFilters(item, sumStatsByModType(area), opts),
        weightFilters: createResistanceWeightFilter(
          item,
          sumStatsByModType(area),
          opts,
        ),
      })),
    };
  }

  if (
    (!item.info.craftable && item.rarity !== ItemRarity.Unique) ||
    item.isUnidentified ||
    item.rarity === ItemRarity.Normal ||
    (item.category === ItemCategory.Flask &&
      item.rarity !== ItemRarity.Unique) ||
    (item.category === ItemCategory.SanctumRelic &&
      item.rarity !== ItemRarity.Unique) ||
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
      active: "filters.preset_exact",
      presets: [
        {
          id: "filters.preset_exact",
          filters: createFilters(item, { ...opts, exact: true }),
          stats: createExactStatFilters(item, item.statsByType, opts),
          weightFilters: createResistanceWeightFilter(
            item,
            item.statsByType,
            opts,
          ),
        },
      ],
    };
  }

  // TODO: pseudo change here
  const pseudoPreset: FilterPreset = {
    id: "filters.preset_pseudo",
    filters: createFilters(item, { ...opts, exact: false }),
    stats: initUiModFilters(item, opts),
    weightFilters: initWeightFilters(item, opts),
  };

  const likelyFinishedItem =
    item.rarity === ItemRarity.Unique ||
    item.statsByType.some((calc) => calc.type === ModifierType.Crafted) ||
    item.quality === 20 || // quality > 20 can be used for selling bases, quality < 20 drops sometimes
    item.isCorrupted ||
    item.isMirrored;

  const hasCraftingValue =
    item.isSynthesised ||
    item.isFractured ||
    item.influences.length ||
    item.category === ItemCategory.ClusterJewel ||
    (item.category === ItemCategory.Jewel &&
      item.rarity === ItemRarity.Magic) ||
    (item.category !== ItemCategory.Jewel &&
      item.category !== ItemCategory.AbyssJewel &&
      item.itemLevel! >= 82) ||
    (!item.isCorrupted &&
      item.rarity === ItemRarity.Magic &&
      item.itemLevel! >= 81 &&
      itemHasPerfectPlusLevels(item));

  // Apply runes if we should
  if (
    (item.rarity === ItemRarity.Magic || item.rarity === ItemRarity.Rare) &&
    pseudoPreset.filters.itemEditorSelection &&
    !pseudoPreset.filters.itemEditorSelection.disabled &&
    opts.autoFillEmptyRuneSockets
  ) {
    handleApplyItemEdits(
      pseudoPreset.stats,
      item,
      pseudoPreset.filters.tempRuneStorage ?? [],
      opts.autoFillEmptyRuneSockets ?? "None",
    );
  }

  if (likelyFinishedItem || !hasCraftingValue) {
    return { active: pseudoPreset.id, presets: [pseudoPreset] };
  }

  const baseItemPreset: FilterPreset = {
    id: "filters.preset_base_item",
    filters: createFilters(item, { ...opts, exact: true }),
    stats: createExactStatFilters(item, item.statsByType, opts),
    weightFilters: createResistanceWeightFilter(item, item.statsByType, opts),
  };

  return {
    active: pseudoPreset.id,
    presets: [pseudoPreset, baseItemPreset],
  };
}

export function itemHasPerfectPlusLevels(item: ParsedItem): boolean {
  for (const mod of item.newMods) {
    if (
      mod.info.tier === 1 &&
      mod.stats[0].stat.ref.startsWith("+# to Level of all ")
    ) {
      return true;
    }
  }
  return false;
}
