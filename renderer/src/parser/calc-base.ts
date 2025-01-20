import { isArmourOrWeapon } from "./Parser";
import { ParsedItem } from "./ParsedItem";
import {
  calcFlat,
  calcIncreased,
  calcPropBase,
  QUALITY_STATS,
} from "./calc-q20";

export function applyIronRune(newItem: ParsedItem, oldItem: ParsedItem) {
  const { category } = newItem;
  const weaponOrArmour = isArmourOrWeapon(category);
  if (weaponOrArmour === undefined) return;
  if (newItem.weaponPHYSICAL) {
    const base = calcBase(
      oldItem,
      oldItem.weaponPHYSICAL,
      QUALITY_STATS.PHYSICAL_DAMAGE,
    );
    const total = calcTotal(base, newItem, QUALITY_STATS.PHYSICAL_DAMAGE);
    newItem.weaponPHYSICAL = total;
  }
  if (newItem.armourAR) {
    const base = calcBase(oldItem, oldItem.armourAR, QUALITY_STATS.ARMOUR);
    const total = calcTotal(base, newItem, QUALITY_STATS.ARMOUR);
    newItem.armourAR = total;
  }
  if (newItem.armourEV) {
    const base = calcBase(oldItem, oldItem.armourEV, QUALITY_STATS.EVASION);
    const total = calcTotal(base, newItem, QUALITY_STATS.EVASION);
    newItem.armourEV = total;
  }
  if (newItem.armourES) {
    const base = calcBase(
      oldItem,
      oldItem.armourES,
      QUALITY_STATS.ENERGY_SHIELD,
    );
    const total = calcTotal(base, newItem, QUALITY_STATS.ENERGY_SHIELD);
    newItem.armourES = total;
  }
}

export function calcBase(
  item: ParsedItem,
  inStat: number | undefined,
  statRefs: { flat: string[]; incr: string[] },
) {
  const { incr, flat } = calcPropBase(statRefs, item);
  const base = calcFlat(inStat ?? 0, incr.value, item.quality) - flat.value;

  return base;
}

export function calcTotal(
  base: number,
  item: ParsedItem,
  statRefs: { flat: string[]; incr: string[] },
) {
  const { incr, flat } = calcPropBase(statRefs, item);

  const damage = calcIncreased(
    base + flat.value,
    incr.value,
    item.quality ?? 0,
  );

  return damage;
}

export function calcBaseDamage(item: ParsedItem) {
  const { category } = item;
  if (isArmourOrWeapon(category) !== "weapon") return 0;
  const { weaponPHYSICAL } = item;
  // Damage = (Base_Damage + Added_Damage) * Increased_Damage * More_Damage
  //           * Hit_Rate * (Critical_Strike_Damage * Critical_Strike_Chance)
  //           (Ignore Hit_Rate and crit stuff)

  const { incr, flat } = calcPropBase(QUALITY_STATS.PHYSICAL_DAMAGE, item);
  const base =
    calcFlat(weaponPHYSICAL ?? 0, incr.value, item.quality) - flat.value;

  return base;
}

export function calcTotalDamage(item: ParsedItem, baseDamage: number) {
  const { category } = item;
  if (isArmourOrWeapon(category) !== "weapon") return 0;
  // Damage = (Base_Damage + Added_Damage) * Increased_Damage * More_Damage
  //           * Hit_Rate * (Critical_Strike_Damage * Critical_Strike_Chance)
  //           (Ignore Hit_Rate and crit stuff)

  const { incr, flat } = calcPropBase(QUALITY_STATS.PHYSICAL_DAMAGE, item);

  const damage = calcIncreased(
    baseDamage + flat.value,
    incr.value,
    item.quality ?? 0,
  );

  return damage;
}
