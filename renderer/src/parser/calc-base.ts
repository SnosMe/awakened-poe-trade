import { isArmourOrWeapon } from "./Parser";
import { ParsedItem } from "./ParsedItem";
import {
  calcFlat,
  calcIncreased,
  calcPropBase,
  OTHER_PSEUDO_STATS,
  QUALITY_STATS,
} from "./calc-q20";

export function recalculateItemProperties(
  newItem: ParsedItem,
  oldItem: ParsedItem,
) {
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
  if (newItem.weaponAS) {
    const base = calcBase(
      oldItem,
      oldItem.weaponAS,
      OTHER_PSEUDO_STATS.ATTACK_SPEED,
      false,
    );
    const total = calcTotal(
      base,
      newItem,
      OTHER_PSEUDO_STATS.ATTACK_SPEED,
      false,
    );
    newItem.weaponAS = total;
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

export function applyEleRune(item: ParsedItem, type: string, values: number[]) {
  const { category } = item;
  const weaponOrArmour = isArmourOrWeapon(category);
  if (weaponOrArmour === undefined || weaponOrArmour === "armour") return;
  if (values.length !== 2) return;
  const adding = values.reduce((a, b) => a + b) / 2;
  if (item.weaponELEMENTAL) {
    item.weaponELEMENTAL += adding;
  } else {
    item.weaponELEMENTAL = adding;
  }
  switch (type) {
    case "Glacial Rune":
    case "Lesser Glacial Rune":
    case "Greater Glacial Rune":
      if (item.weaponCOLD) {
        item.weaponCOLD += adding;
      } else {
        item.weaponCOLD = adding;
      }
      break;
    case "Storm Rune":
    case "Lesser Storm Rune":
    case "Greater Storm Rune":
      if (item.weaponLIGHTNING) {
        item.weaponLIGHTNING += adding;
      } else {
        item.weaponLIGHTNING = adding;
      }
      break;
    case "Desert Rune":
    case "Lesser Desert Rune":
    case "Greater Desert Rune":
      if (item.weaponFIRE) {
        item.weaponFIRE += adding;
      } else {
        item.weaponFIRE = adding;
      }
      break;
    default:
      break;
  }
}

export function calcBase(
  item: ParsedItem,
  inStat: number | undefined,
  statRefs: { flat: string[]; incr: string[] },
  useQuality = true,
) {
  const { incr, flat } = calcPropBase(statRefs, item);
  const base =
    calcFlat(inStat ?? 0, incr.value, useQuality ? (item.quality ?? 0) : 0) -
    flat.value;

  return base;
}

export function calcTotal(
  base: number,
  item: ParsedItem,
  statRefs: { flat: string[]; incr: string[] },
  useQuality = true,
) {
  const { incr, flat } = calcPropBase(statRefs, item);

  const damage = calcIncreased(
    base + flat.value,
    incr.value,
    useQuality ? (item.quality ?? 0) : 0,
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
