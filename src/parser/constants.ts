export enum ItemRarity {
  Normal = 'Normal',
  Magic = 'Magic',
  Rare = 'Rare',
  Unique = 'Unique',
  Gem = 'Gem',
  Currency = 'Currency',
  DivinationCard = 'Divination Card'
}

export enum ItemInfluence {
  Crusader = 'Crusader',
  Elder = 'Elder',
  Hunter = 'Hunter',
  Redeemer = 'Redeemer',
  Shaper = 'Shaper',
  Warlord = 'Warlord'
}

export const CRUSADER_ITEM = 'Crusader Item'
export const ELDER_ITEM = 'Elder Item'
export const HUNTER_ITEM = 'Hunter Item'
export const REDEEMER_ITEM = 'Redeemer Item'
export const SHAPER_ITEM = 'Shaper Item'
export const WARLORD_ITEM = 'Warlord Item'

export const TAG_MAP_TIER = 'Map Tier: '
export const TAG_RARITY = 'Rarity: '
export const TAG_ITEM_CLASS = 'Item Class: '
export const TAG_ITEM_LEVEL = 'Item Level: '
export const TAG_TALISMAN_TIER = 'Talisman Tier: '
export const TAG_GEM_LEVEL = 'Level: '
export const TAG_STACK_SIZE = 'Stack Size: '
export const TAG_SOCKETS = 'Sockets: '
export const TAG_QUALITY = 'Quality: '
export const TAG_AREA_LEVEL = 'Area Level: '

export const TAG_PHYSICAL_DAMAGE = 'Physical Damage: '
export const TAG_ELEMENTAL_DAMAGE = 'Elemental Damage: '
export const TAG_CRIT_CHANCE = 'Critical Strike Chance: '
export const TAG_ATTACK_SPEED = 'Attacks per Second: '

export const TAG_ARMOUR = 'Armour: '
export const TAG_EVASION = 'Evasion Rating: '
export const TAG_ENERGY_SHIELD = 'Energy Shield: '
export const TAG_BLOCK_CHANCE = 'Chance to Block: '

export const IMPLICIT_LINE = ' (implicit)'
export const CRAFTED_LINE = ' (crafted)'
export const ENCHANT_LINE = ' (enchant)'
export const FRACTURED_LINE = ' (fractured)'

export const CORRUPTED = 'Corrupted'
export const UNIDENTIFIED = 'Unidentified'
export const FLASK_CHARGES = '/^Currently has \\d+ Charges$/'
export const SEED_MONSTER_LEVEL = '/^Spawns a Level (\\d+) Monster when Harvested$/'
export const SECTION_SYNTHESISED = 'Synthesised Item'
export const ITEM_SYNTHESISED = '/^Synthesised (.*)$/'
export const MAP_BLIGHTED = '/^Blighted (.*)$/'
export const ITEM_SUPERIOR = '/^Superior (.*)$/'
export const VAAL_GEM = '/^Vaal .*$/'

export const PROPHECY_HELP = 'Right-click to add this prophecy to your character.'
export const BEAST_HELP = 'Right-click to add this to your bestiary.'
export const METAMORPH_HELP = "Combine this with four other different samples in Tane's Laboratory."
export const SEED_HELP = 'Right-click this item then left-click the ground to plant it in the Sacred Grove.' // Once planted and fully grown, can be Harvested by using a nearby (Wild|Vivid|Primal) Collector.

export const METAMORPH_BRAIN = '/^.* Brain$/'
export const METAMORPH_EYE = '/^.* Eye$/'
export const METAMORPH_LUNG = '/^.* Lung$/'
export const METAMORPH_HEART = '/^.* Heart$/'
export const METAMORPH_LIVER = '/^.* Liver$/'

export const PROPHECY_ALVA = 'You will find Alva and complete her mission.'
export const PROPHECY_EINHAR = 'You will find Einhar and complete his mission.'
export const PROPHECY_NIKO = 'You will find Niko and complete his mission.'
export const PROPHECY_JUN = 'You will find Jun and complete her mission.'
export const PROPHECY_ZANA = 'You will find Zana and complete her mission.'

export const CANNOT_USE_ITEM = 'You cannot use this item. Its stats will be ignored'

export const QUALITY_ANOMALOUS = '/^Anomalous (.*)$/'
export const QUALITY_DIVERGENT = '/^Divergent (.*)$/'
export const QUALITY_PHANTASMAL = '/^Phantasmal (.*)$/'

export const HEIST_JOB = '/^Requires (.+) \\(Level (\\d+)\\)$/'

export const MIRRORED = 'Mirrored'
