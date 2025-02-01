import type { ModifierType, StatCalculated } from "./modifiers";
import type { ParsedModifier } from "./advanced-mod-desc";
import type { BaseType } from "@/assets/data";
import { ItemCategory } from "./meta";

export enum ItemRarity {
  Normal = "Normal",
  Magic = "Magic",
  Rare = "Rare",
  Unique = "Unique",
}

export enum ItemInfluence {
  Crusader = "Crusader",
  Elder = "Elder",
  Hunter = "Hunter",
  Redeemer = "Redeemer",
  Shaper = "Shaper",
  Warlord = "Warlord",
}

// export interface Rune {
//   index: number;
//   isEmpty: boolean;
//   rune?: string;
//   text?: string; // Text of modifier
//   isFake?: boolean;
//   modifier?: ParsedModifier; // @deprecated
//   statCalculated?: StatCalculated; // @deprecated
// }

export interface BaseParsedItem {
  rarity?: ItemRarity;
  itemLevel?: number;
  armourAR?: number;
  armourEV?: number;
  armourES?: number;
  armourBLOCK?: number;
  basePercentile?: number;
  weaponCRIT?: number;
  weaponAS?: number;
  weaponPHYSICAL?: number;
  weaponELEMENTAL?: number;
  weaponFIRE?: number;
  weaponCOLD?: number;
  weaponLIGHTNING?: number;
  weaponChaos?: number;
  mapBlighted?: "Blighted" | "Blight-ravaged";
  mapTier?: number;
  gemLevel?: number;
  areaLevel?: number;
  talismanTier?: number;
  quality?: number;
  runeSockets?: {
    type: "armour" | "weapon";
    empty: number;
    current: number;
    normal: number;
  };
  gemSockets?: {
    number: number;
    linked?: number; // only 5 or 6
    white: number;
  };
  stackSize?: { value: number; max: number };
  isUnidentified: boolean;
  isCorrupted: boolean;
  isUnmodifiable?: boolean;
  isMirrored?: boolean;
  influences: ItemInfluence[];
  logbookAreaMods?: ParsedModifier[][];
  sentinelCharge?: number;
  isSynthesised?: boolean;
  isFractured?: boolean;
  isVeiled?: boolean;
  isFoil?: boolean;
  statsByType: StatCalculated[];
  newMods: ParsedModifier[];
  unknownModifiers: Array<{
    text: string;
    type: ModifierType;
  }>;
  heist?: {
    wingsRevealed?: number;
    target?: "Enchants" | "Trinkets" | "Gems" | "Replicas";
  };
  category?: ItemCategory;
  info: BaseType;
  rawText: string;
  fromChat?: boolean;
}

export interface ParsedItem extends BaseParsedItem {
  originalItem?: BaseParsedItem;
}

// NOTE: should match option values on trade
export enum IncursionRoom {
  Open = 1,
  Obstructed = 2,
}

export function createVirtualItem(
  props: Partial<ParsedItem> & Pick<ParsedItem, "info">,
): ParsedItem {
  return {
    ...props,
    isUnidentified: props.isUnidentified ?? false,
    isCorrupted: props.isCorrupted ?? false,
    newMods: props.newMods ?? [],
    statsByType: props.statsByType ?? [],
    unknownModifiers: props.unknownModifiers ?? [],
    influences: props.influences ?? [],
    rawText: "VIRTUAL_ITEM",
  };
}
