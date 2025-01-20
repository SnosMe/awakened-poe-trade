import { ItemRarity, ParsedItem } from "@/parser";
import { StatFilter } from "./interfaces";
import { applyIronRune } from "@/parser/calc-base";
import { RUNE_DATA_BY_RUNE } from "@/assets/data";
import {
  isArmourOrWeapon,
  parseModifiersPoe2,
  replaceHashWithValues,
} from "@/parser/Parser";
import { ModifierType, sumStatsByModType } from "@/parser/modifiers";
import { FiltersCreationContext } from "./create-stat-filters";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { filterItemProp } from "./pseudo/item-property";

export function handleFillButtonPress(
  filters: StatFilter[],
  item: ParsedItem,
  shouldFill: boolean,
  filterStorage: StatFilter[],
) {
  if (shouldFill) {
    if (filterStorage.length !== 0) return;
    // Testing with just one stat
    const newFilters = createNewStatFilter(item, "Iron Rune");
    if (!newFilters) return;
    const newFiltersByRef = newFilters.reduce<Record<string, StatFilter>>(
      (dict, filter) => {
        if (filter.statRef) {
          dict[filter.statRef] = filter; // Use `statRef` as the key
        }
        return dict;
      },
      {},
    );
    // change it
    for (let i = 0; i < filters.length; i++) {
      const newFilter = newFiltersByRef[filters[i].statRef];
      if (newFilter) {
        filterStorage.push(filters[i]);
        filters[i] = newFilter;
      }
    }
  } else {
    // reset back to normal
    while (filterStorage.length > 0) {
      const filterToInsert = filterStorage.pop()!;
      const filterToReplace = filters.find(
        (stat) => stat.statRef === filterToInsert.statRef,
      );
      if (filterToReplace) {
        filters[filters.indexOf(filterToReplace)] = filterToInsert;
      }
    }
  }
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
    runeData.baseStat,
    runeData.values.map((v) => v * emptyRuneCount),
  );
  parseModifiersPoe2([statString], newItem);
  newItem.statsByType = sumStatsByModType(newItem.newMods);
  const range = AppConfig<PriceCheckWidget>("price-check")!.searchStatRange;
  const ctx: FiltersCreationContext = {
    item: newItem,
    filters: [],
    searchInRange: item.rarity === ItemRarity.Normal ? 100 : range,
    statsByType: item.statsByType.map((calc) => {
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

  if (newRune === "Iron Rune") {
    // const base = calcBaseDamage(item);
    // const total = calcTotalDamage(newItem, base);
    // newItem.weaponPHYSICAL = total;
    applyIronRune(newItem, item);
    filterItemProp(ctx);
    return ctx.filters;
  }
}
