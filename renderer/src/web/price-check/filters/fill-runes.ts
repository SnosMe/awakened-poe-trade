import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import { StatFilter } from "./interfaces";
import { applyEleRune, recalculateItemProperties } from "@/parser/calc-base";
import { BaseType, RUNE_DATA_BY_RUNE } from "@/assets/data";
import {
  isArmourOrWeapon,
  parseModifiersPoe2,
  replaceHashWithValues,
} from "@/parser/Parser";
import { ModifierType, sumStatsByModType } from "@/parser/modifiers";
import {
  calculatedStatToFilter,
  FiltersCreationContext,
} from "./create-stat-filters";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { filterItemProp } from "./pseudo/item-property";
import { ADDED_RUNE_LINE } from "@/parser/advanced-mod-desc";
import { filterPseudo } from "./pseudo";
import { ItemEditorType } from "@/parser/meta";

export function handleApplyItemEdits(
  filters: StatFilter[],
  item: ParsedItem,
  filterStorage: StatFilter[],
  currencyItem: string,
  editType?: ItemEditorType,
) {
  if (filterStorage.length !== 0) return;
  console.log("FILLLLLLLLLLLLLLLLLLLL");
  // Testing with just one stat
  const newFilters = createNewStatFilter(item, currencyItem ?? "Iron Rune");
  if (!newFilters) return;

  for (const filter of newFilters) {
    // get on/off state of old filter
    const oldFilter = filters.find(
      (stat) => stat.statRef === filter.statRef && stat.tag === filter.tag,
    );
    if (oldFilter) {
      filter.disabled = oldFilter.disabled;
    }
  }
  // Store a copy of the current filters, then replace contents
  filterStorage.splice(
    0,
    filterStorage.length,
    ...JSON.parse(JSON.stringify(filters)),
  );

  // Clear and add new filters into the `filters` array
  filters.splice(0, filters.length, ...newFilters);
}

export function handleRemoveItemEdits(
  filters: StatFilter[],
  item: ParsedItem,
  filterStorage: StatFilter[],
) {
  // reset back to normal
  console.log("REMOVE");
  for (const filterToApply of filterStorage) {
    // get on/off state of old filter
    const oldFilter = filters.find(
      (stat) =>
        stat.statRef === filterToApply.statRef &&
        stat.tag === filterToApply.tag,
    );
    if (oldFilter) {
      filterToApply.disabled = oldFilter.disabled;
    }
  }

  filters.splice(0, filters.length, ...filterStorage);
  filterStorage.length = 0;
}

function createNewStatFilter(
  item: ParsedItem,
  newRune: string,
): StatFilter[] | undefined {
  const newItem = JSON.parse(JSON.stringify(item)) as ParsedItem;
  const runeData = RUNE_DATA_BY_RUNE[newRune].find(
    (rune) => rune.type === isArmourOrWeapon(item.category),
  );
  if (!runeData) return;
  const emptyRuneCount = item.runeSockets!.empty;
  const statString = replaceHashWithValues(
    runeData.baseStat + ADDED_RUNE_LINE,
    runeData.values.map((v) => v * emptyRuneCount),
  );
  parseModifiersPoe2([statString], newItem);
  newItem.statsByType = sumStatsByModType(newItem.newMods);
  const range = AppConfig<PriceCheckWidget>("price-check")!.searchStatRange;
  const ctx: FiltersCreationContext = {
    item: newItem,
    filters: [],
    searchInRange: newItem.rarity === ItemRarity.Normal ? 100 : range,
    statsByType: newItem.statsByType.map((calc) => {
      if (
        calc.type === ModifierType.Fractured &&
        calc.stat.trade.ids[ModifierType.Explicit]
      ) {
        return { ...calc, type: ModifierType.Explicit };
      } else {
        return calc;
      }
    }),
  };

  if (
    newRune === "Glacial Rune" ||
    newRune === "Storm Rune" ||
    newRune === "Desert Rune"
  ) {
    applyEleRune(newItem, newRune, runeData.values);
  }

  recalculateItemProperties(newItem, item);
  filterItemProp(ctx);
  filterPseudo(
    ctx,
    AppConfig<PriceCheckWidget>("price-check")!.usePseudo &&
      ["en", "ru", "ko", "cmn-Hant"].includes(AppConfig().language),
  );

  ctx.filters.push(
    ...ctx.statsByType.map((mod) =>
      calculatedStatToFilter(
        mod,
        ctx.searchInRange,
        newItem,
        mod.type !== "added-rune",
      ),
    ),
  );

  return ctx.filters;
}

export function selectRuneEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["rune"],
) {
  const a = isArmourOrWeapon(category);
  if (!a || !rune) return;

  // try to get by most general first
  if (a in rune) {
    return rune[a];
  }
  if (category.toLowerCase() in rune) {
    return rune[category.toLowerCase()];
  }
}
