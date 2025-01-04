import { isArmourOrWeapon } from "./Parser";
import { ParsedItem } from "./ParsedItem";
import {
  calcFlat,
  calcIncreased,
  calcPropBase,
  QUALITY_STATS,
} from "./calc-q20";

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
