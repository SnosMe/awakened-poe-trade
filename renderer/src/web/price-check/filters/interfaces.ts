import { BaseType } from "@/assets/data";
import type { ItemInfluence, ItemCategory } from "@/parser";
import type { StatCalculated } from "@/parser/modifiers";
import type { ParsedItem } from "@/parser/ParsedItem";

export interface FilterPreset {
  id: string;
  filters: ItemFilters;
  stats: StatFilter[];
  weightFilters: WeightStatGroup[];
}

interface SearchFilter {
  name?: string;
  nameTrade?: string;
  baseType?: string;
  baseTypeTrade?: string;
  category?: ItemCategory;
}

export interface Suggestion {
  type: "exalted";
  text?: string;
  text2?: string;
  confidenceLevel?: "Low" | "Medium" | "High";
}

export interface ItemFilters {
  searchExact: SearchFilter;
  searchRelaxed?: SearchFilter & { disabled: boolean };
  discriminator?: {
    value?: string;
    trade: string;
  };
  rarity?: {
    value: string;
  };
  socketNumber?: FilterNumeric;
  linkedSockets?: FilterNumeric;
  whiteSockets?: FilterNumeric;
  runeSockets?: FilterNumeric;
  itemEditorSelection?: { disabled: boolean; editing: boolean; value: string };
  corrupted?: {
    value: boolean;
    exact?: boolean;
  };
  fractured?: {
    value: boolean;
  };
  mirrored?: {
    disabled: boolean;
  };
  foil?: {
    disabled: boolean;
  };
  influences?: Array<{
    value: ItemInfluence;
    disabled: boolean;
  }>;
  quality?: FilterNumeric;
  gemLevel?: FilterNumeric;
  mapTier?: FilterNumeric;
  mapBlighted?: {
    value: NonNullable<ParsedItem["mapBlighted"]>;
  };
  itemLevel?: FilterNumeric;
  stackSize?: FilterNumeric;
  unidentified?: {
    value: true;
    disabled: boolean;
  };
  veiled?: {
    statRefs: string[];
    disabled: boolean;
  };
  areaLevel?: FilterNumeric;
  heistWingsRevealed?: FilterNumeric;
  sentinelCharge?: FilterNumeric;
  trade: {
    offline: boolean;
    onlineInLeague: boolean;
    listed: string | undefined;
    currency: string | undefined;
    league: string;
    collapseListings: "api" | "app";
    currencyRatio: number;
  };
  tempRuneStorage?: StatFilter[];
}

export interface FilterNumeric {
  value: number;
  max?: number | undefined;
  disabled: boolean;
}

export interface FilterDropdown {
  value: string;
  disabled: boolean;
  options: Array<{ label: string; value: string }>;
}

export interface StatFilterRoll {
  value: number;
  min: number | "" | undefined; // NOTE: mutable in UI
  max: number | "" | undefined; // NOTE: mutable in UI
  default: { min: number; max: number };
  bounds?: { min: number; max: number };
  tradeInvert?: boolean;
  dp: boolean;
  isNegated: boolean;
  goodness?: number;
}

export interface StatFilter {
  tradeId: string[];
  statRef: string;
  text: string;
  tag: FilterTag;
  oils?: string[];
  sources: StatCalculated["sources"];
  roll?: StatFilterRoll;
  option?: {
    value: number; // NOTE: mutable in UI
  };
  hidden?: string;
  disabled: boolean; // NOTE: mutable in UI
  weight?: number;
  additionalInfo?: {
    [key: string]: StatFilterRoll;
  };
  editorAdded?: BaseType;
}

export interface WeightStatGroup {
  stats: StatFilter[];
  name: string;
  value: {
    min?: number;
    max?: number;
  };
  disabled: boolean;
}

export const RESISTANCE_WEIGHT_GROUP: string =
  "RESISTANCE_WEIGHT_GROUP" as const;

export const INTERNAL_TRADE_IDS = [
  "item.base_percentile",
  "item.armour",
  "item.evasion_rating",
  "item.energy_shield",
  "item.block",
  "item.total_dps",
  "item.physical_dps",
  "item.elemental_dps",
  "item.crit",
  "item.aps",
  "item.has_empty_modifier",
  "item.spirit",
  "item.has_elemental_affix",
  "item.has_elemental_fire_affix",
  "item.has_elemental_cold_affix",
  "item.has_elemental_lightning_affix",
] as const;

export type InternalTradeId = (typeof INTERNAL_TRADE_IDS)[number];

export enum ItemHasEmptyModifier {
  Any = 0,
  Prefix = 1,
  Suffix = 2,
}
export enum ItemIsElementalModifier {
  Any = 0,
  Fire = 1,
  Cold = 2,
  Lightning = 3,
}

export enum FilterTag {
  Pseudo = "pseudo",
  Explicit = "explicit",
  Implicit = "implicit",
  Crafted = "crafted",
  Enchant = "enchant",
  Scourge = "scourge",
  Fractured = "fractured",
  Corrupted = "corrupted",
  Synthesised = "synthesised",
  Eldritch = "eldritch",
  Variant = "variant",
  Property = "property",
  Shaper = "explicit-shaper",
  Elder = "explicit-elder",
  Crusader = "explicit-crusader",
  Hunter = "explicit-hunter",
  Redeemer = "explicit-redeemer",
  Warlord = "explicit-warlord",
  Delve = "explicit-delve",
  Unveiled = "explicit-veiled",
  Incursion = "explicit-incursion",
  Rune = "rune",
  AddedRune = "added-rune",
}
