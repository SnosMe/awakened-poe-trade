export enum ItemCategory {
  Map = "Map",
  CapturedBeast = "Captured Beast",
  MetamorphSample = "Metamorph Sample",
  Helmet = "Helmet",
  BodyArmour = "Body Armour",
  Gloves = "Gloves",
  Boots = "Boots",
  Shield = "Shield",
  Amulet = "Amulet",
  Belt = "Belt",
  Ring = "Ring",
  Flask = "Flask",
  AbyssJewel = "Abyss Jewel",
  Jewel = "Jewel",
  Quiver = "Quiver",
  Claw = "Claw",
  Bow = "Bow",
  Sceptre = "Sceptre",
  Wand = "Wand",
  FishingRod = "Fishing Rod",
  Staff = "Staff",
  Warstaff = "Warstaff",
  Dagger = "Dagger",
  RuneDagger = "Rune Dagger",
  OneHandedAxe = "One-Handed Axe",
  TwoHandedAxe = "Two-Handed Axe",
  OneHandedMace = "One-Handed Mace",
  TwoHandedMace = "Two-Handed Mace",
  OneHandedSword = "One-Handed Sword",
  TwoHandedSword = "Two-Handed Sword",
  ClusterJewel = "Cluster Jewel",
  HeistBlueprint = "Heist Blueprint",
  HeistContract = "Heist Contract",
  HeistTool = "Heist Tool",
  HeistBrooch = "Heist Brooch",
  HeistGear = "Heist Gear",
  HeistCloak = "Heist Cloak",
  Trinket = "Trinket",
  Invitation = "Invitation",
  Gem = "Gem",
  Currency = "Currency",
  DivinationCard = "Divination Card",
  Voidstone = "Voidstone",
  Sentinel = "Sentinel",
  MemoryLine = "Memory Line",
  SanctumRelic = "Sanctum Relic",
  Tincture = "Tincture",
  Charm = "Charm",
  Crossbow = "Crossbow",
  SkillGem = "Skill Gem",
  SupportGem = "Support Gem",
  MetaGem = "Meta Gem",
  Focus = "Focus",
  Spear = "Spear",
  Flail = "Flail",
  Buckler = "Buckler",
}

export interface StatMatcher {
  string: string;
  advanced?: string;
  negate?: true;
  value?: number;
  oils?: string; // Amulet anointment
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
    category: string;
    corrupted?: true;
    uniqueOnly?: true;
  };
  unique?: {
    base: BaseType["refName"];
    fixedStats?: Array<Stat["ref"]>;
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
}
