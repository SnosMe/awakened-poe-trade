import { ItemCategory } from "@/parser";

export interface StatMatcher {
  string: string;
  advanced?: string;
  negate?: true;
  value?: number;
  oils?: string; // Amulet anointment
}

export interface StatTier {
  ilvl: number;
  id: string;
  name: string;
  values: number[][];
  items: string[];
}

export interface StatTierMod {
  id: string;
  generation?: string;
  items: {
    [type: string]: number;
  };
  mods: StatTier[];
}

export enum StatBetter {
  NegativeRoll = -1,
  PositiveRoll = 1,
  NotComparable = 0,
}

export interface Stat {
  ref: string;
  dp?: true;
  matchers: StatMatcher[];
  better: StatBetter;
  fromAreaMods?: true;
  fromUberAreaMods?: true;
  fromHeistAreaMods?: true;
  anointments?: Array<{ roll: number; oils: string }>; // Ring anointments
  trade: {
    inverted?: true;
    option?: true;
    ids: {
      [type: string]: string[];
    };
  };
}

export interface DropEntry {
  query: string[];
  items: string[];
}

export interface BaseType {
  name: string;
  refName: string;
  namespace: "DIVINATION_CARD" | "CAPTURED_BEAST" | "UNIQUE" | "ITEM" | "GEM";
  icon: string;
  w?: number;
  h?: number;
  tradeTag?: string;
  tradeDisc?: string;
  disc?: {
    propAR?: true;
    propEV?: true;
    propES?: true;
    hasImplicit?: { ref: Stat["ref"] };
    hasExplicit?: { ref: Stat["ref"] };
    sectionText?: string;
    mapTier?: "W" | "Y" | "R";
  };
  // extra info
  craftable?: {
    category: ItemCategory;
    corrupted?: true;
    uniqueOnly?: true;
  };
  unique?: {
    base: BaseType["refName"];
    fixedStats?: string[];
  };
  map?: {
    screenshot?: string;
  };
  gem?: {
    vaal?: true;
    awakened?: true;
    transfigured?: true;
    normalVariant?: BaseType["refName"];
  };
  armour?: {
    ar?: [min: number, max: number];
    ev?: [min: number, max: number];
    es?: [min: number, max: number];
  };
  rune?: Array<{
    categories: ItemCategory[];
    string: string;
    values: number[];
    tradeId?: string[];
  }>;
  tags: string[];
}

export interface TranslationDict {
  RARITY_NORMAL: string;
  RARITY_MAGIC: string;
  RARITY_RARE: string;
  RARITY_UNIQUE: string;
  RARITY_GEM: string;
  RARITY_CURRENCY: string;
  RARITY_DIVCARD: string;
  RARITY_QUEST: string;
  MAP_TIER: string;
  RARITY: string;
  ITEM_CLASS: string;
  ITEM_LEVEL: string;
  CORPSE_LEVEL: string;
  TALISMAN_TIER: string;
  GEM_LEVEL: string;
  STACK_SIZE: string;
  SOCKETS: string;
  QUALITY: string;
  PHYSICAL_DAMAGE: string;
  ELEMENTAL_DAMAGE: string;
  CRIT_CHANCE: string;
  ATTACK_SPEED: string;
  ARMOUR: string;
  EVASION: string;
  ENERGY_SHIELD: string;
  BLOCK_CHANCE: string;
  CORRUPTED: string;
  UNIDENTIFIED: string;
  ITEM_SUPERIOR: RegExp;
  MAP_BLIGHTED: RegExp;
  MAP_BLIGHT_RAVAGED: RegExp;
  INFLUENCE_SHAPER: string;
  INFLUENCE_ELDER: string;
  INFLUENCE_CRUSADER: string;
  INFLUENCE_HUNTER: string;
  INFLUENCE_REDEEMER: string;
  INFLUENCE_WARLORD: string;
  SECTION_SYNTHESISED: string;
  ITEM_SYNTHESISED: RegExp;
  VEILED_PREFIX: string;
  VEILED_SUFFIX: string;
  FLASK_CHARGES: RegExp;
  METAMORPH_HELP: string;
  BEAST_HELP: string;
  VOIDSTONE_HELP: string;
  METAMORPH_BRAIN: RegExp;
  METAMORPH_EYE: RegExp;
  METAMORPH_LUNG: RegExp;
  METAMORPH_HEART: RegExp;
  METAMORPH_LIVER: RegExp;
  CANNOT_USE_ITEM: string;
  QUALITY_ANOMALOUS: RegExp;
  QUALITY_DIVERGENT: RegExp;
  QUALITY_PHANTASMAL: RegExp;
  AREA_LEVEL: string;
  HEIST_WINGS_REVEALED: string;
  HEIST_TARGET: string;
  HEIST_BLUEPRINT_ENCHANTS: string;
  HEIST_BLUEPRINT_TRINKETS: string;
  HEIST_BLUEPRINT_GEMS: string;
  HEIST_BLUEPRINT_REPLICAS: string;
  MIRRORED: string;
  MODIFIER_LINE: RegExp;
  PREFIX_MODIFIER: string;
  SUFFIX_MODIFIER: string;
  CRAFTED_PREFIX: string;
  CRAFTED_SUFFIX: string;
  UNSCALABLE_VALUE: string;
  CORRUPTED_IMPLICIT: string;
  MODIFIER_INCREASED: RegExp;
  INCURSION_OPEN: string;
  INCURSION_OBSTRUCTED: string;
  EATER_IMPLICIT: RegExp;
  EXARCH_IMPLICIT: RegExp;
  ELDRITCH_MOD_R1: string;
  ELDRITCH_MOD_R2: string;
  ELDRITCH_MOD_R3: string;
  ELDRITCH_MOD_R4: string;
  ELDRITCH_MOD_R5: string;
  ELDRITCH_MOD_R6: string;
  SENTINEL_CHARGE: string;
  SHAPER_MODS: string[];
  ELDER_MODS: string[];
  CRUSADER_MODS: string[];
  HUNTER_MODS: string[];
  REDEEMER_MODS: string[];
  WARLORD_MODS: string[];
  DELVE_MODS: string[];
  VEILED_MODS: string[];
  INCURSION_MODS: string[];
  FOIL_UNIQUE: string;
  UNMODIFIABLE: string;
  REQUIREMENTS: string;
  REQUIRES: string;
  CHARM_SLOTS: string;
  BASE_SPIRIT: string;
  QUIVER_HELP_TEXT: string;
  FLASK_HELP_TEXT: string;
  CHARM_HELP_TEXT: string;
  // ---
  CHAT_SYSTEM: RegExp;
  CHAT_TRADE: RegExp;
  CHAT_GLOBAL: RegExp;
  CHAT_PARTY: RegExp;
  CHAT_GUILD: RegExp;
  CHAT_WHISPER_TO: RegExp;
  CHAT_WHISPER_FROM: RegExp;
  CHAT_WEBTRADE_GEM: RegExp;
  // ---
  FIRE_DAMAGE: string;
  LIGHTNING_DAMAGE: string;
  COLD_DAMAGE: string;
  PRICE_NOTE: string;
  WAYSTONE_TIER: string;
  WAYSTONE_HELP: string;
  JEWEL_HELP: string;
  SANCTUM_HELP: string;
  TIMELESS_RADIUS: string;
  PRECURSOR_TABLET_HELP: string;
  LOGBOOK_HELP: string;
  TIMELESS_SMALL_PASSIVES: string;
  TIMELESS_NOTABLE_PASSIVES: string;
  GRANTS_SKILL: string;
  RELOAD_SPEED: string;
}

export interface Filter {
  id: string;
  value: {
    weight: number;
  };
  disabled: boolean;
}

export interface PseudoIdToTradeRequest {
  [id: string]: {
    filters: Filter[];
    type: "weight";
    value: {
      min?: number;
      max?: number;
    };
    disabled?: boolean;
  };
}

export interface ItemCategoryToEmptyPrefix {
  [id: string]: {
    filters: Filter[];
    type: "not";
    disabled?: boolean;
  };
}

export interface RuneSingleValue {
  [id: string]: {
    rune: string;
    baseStat: string;
    values: number[];
    id: string;
    type: "armour" | "weapon";
  };
}

export interface RuneData {
  rune: string;
  refName: string;
  baseStat: string;
  values: number[];
  id: string;
  categories: ItemCategory[];
  icon: string;
}
/**
 * Key for each rune, Iron, Lesser Rebirth, Soul core of xx
 *
 * Value is each option that the value could be for, ie stat for armour or weapon.
 */
export interface RuneDataByRune {
  [rune: string]: RuneData[];
}
export interface RuneDataByTradeId {
  [tradeId: string]: Array<{
    rune: string;
    baseStat: string;
    values: number[];
    id: string;
    categories: ItemCategory[];
    icon: string;
  }>;
}
