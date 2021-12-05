import type { ItemCategory } from '@/parser'

export interface StatMatcher {
  string: string
  advanced?: string
  negate?: true
  value?: number
}

export enum StatBetter {
  NegativeRoll = -1,
  PositiveRoll = 1,
  NotComparable = 0
}

export interface Stat {
  ref: string
  dp?: true
  matchers: StatMatcher[]
  better: StatBetter
  fromAreaMods?: true
  fromHeistAreaMods?: true
  trade: {
    inverted?: true
    option?: 'num' | 'str'
    ids: {
      [type: string]: string[]
    }
  }
}

export interface DropEntry {
  query: string[]
  items: string[]
}

export interface BlightRecipes {
  oils: string[]
  recipes: {
    [statValue: number]: number[]
  }
}

export interface BaseType {
  name: string
  refName: string
  namespace: (
    'DIVINATION_CARD' |
    'CAPTURED_BEAST' |
    'PROPHECY' |
    'UNIQUE' |
    'ITEM' |
    'GEM'
  )
  icon: string
  tradeTag?: string
  tradeDisc?: string
  disc?: {
    propAR?: true
    propEV?: true
    propES?: true
    hasImplicit?: { ref: string }
    hasExplicit?: { ref: string }
    sectionText?: string
    mapTier?: 'W' | 'Y' | 'R'
  }
  // extra info
  craftable?: {
    category: ItemCategory
    corrupted?: true
    uniqueOnly?: true
  }
  unique?: {
    base: string
  }
  map?: {
    screenshot?: string
  }
  prophecy?: {
    masterName?: string
  }
  gem?: {
    vaal?: true
    awakened?: true
    altQuality?: string[]
    normalVariant?: string
  }
}

export interface TranslationDict {
  RARITY_NORMAL: string
  RARITY_MAGIC: string
  RARITY_RARE: string
  RARITY_UNIQUE: string
  RARITY_GEM: string
  RARITY_CURRENCY: string
  RARITY_DIVCARD: string
  MAP_TIER: string
  RARITY: string
  ITEM_CLASS: string
  ITEM_LEVEL: string
  TALISMAN_TIER: string
  GEM_LEVEL: string
  STACK_SIZE: string
  SOCKETS: string
  QUALITY: string
  PHYSICAL_DAMAGE: string
  ELEMENTAL_DAMAGE: string
  CRIT_CHANCE: string
  ATTACK_SPEED: string
  ARMOUR: string
  EVASION: string
  ENERGY_SHIELD: string
  TAG_WARD: string
  BLOCK_CHANCE: string
  CORRUPTED: string
  UNIDENTIFIED: string
  ITEM_SUPERIOR: RegExp
  MAP_BLIGHTED: RegExp
  MAP_BLIGHT_RAVAGED: RegExp
  INFLUENCE_SHAPER: string
  INFLUENCE_ELDER: string
  INFLUENCE_CRUSADER: string
  INFLUENCE_HUNTER: string
  INFLUENCE_REDEEMER: string
  INFLUENCE_WARLORD: string
  SECTION_SYNTHESISED: string
  ITEM_SYNTHESISED: RegExp
  VEILED_PREFIX: string
  VEILED_SUFFIX: string
  FLASK_CHARGES: RegExp
  SEED_MONSTER_LEVEL: RegExp
  SEED_HELP: string
  METAMORPH_HELP: string
  BEAST_HELP: string
  PROPHECY_HELP: string
  METAMORPH_BRAIN: RegExp
  METAMORPH_EYE: RegExp
  METAMORPH_LUNG: RegExp
  METAMORPH_HEART: RegExp
  METAMORPH_LIVER: RegExp
  PROPHECY_ALVA: string
  PROPHECY_EINHAR: string
  PROPHECY_NIKO: string
  PROPHECY_JUN: string
  PROPHECY_ZANA: string
  CANNOT_USE_ITEM: string
  QUALITY_ANOMALOUS: RegExp
  QUALITY_DIVERGENT: RegExp
  QUALITY_PHANTASMAL: RegExp
  HEIST_REQUIRED_JOB: RegExp
  AREA_LEVEL: string
  HEIST_JOB: Record<string, string>
  MIRRORED: string
  MODIFIER_LINE: RegExp
  PREFIX_MODIFIER: string
  SUFFIX_MODIFIER: string
  CRAFTED_PREFIX: string
  CRAFTED_SUFFIX: string
  UNSCALABLE_VALUE: string
  CORRUPTED_IMPLICIT: string
  MODIFIER_INCREASED: RegExp
  INCURSION_OPEN: string
  INCURSION_OBSTRUCTED: string
  // ---
  CHAT_SYSTEM: RegExp
  CHAT_TRADE: RegExp
  CHAT_GLOBAL: RegExp
  CHAT_PARTY: RegExp
  CHAT_GUILD: RegExp
  CHAT_WHISPER_TO: RegExp
  CHAT_WHISPER_FROM: RegExp
  CHAT_WEBTRADE_GEM: RegExp
}
