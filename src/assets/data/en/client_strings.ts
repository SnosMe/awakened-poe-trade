const dict = {
  'Normal': 'Normal',
  'Magic': 'Magic',
  'Rare': 'Rare',
  'Unique': 'Unique',
  'Gem': 'Gem',
  'Currency': 'Currency',
  'Divination Card': 'Divination Card',
  'Map Tier: ': 'Map Tier: ',
  'Rarity: ': 'Rarity: ',
  'Item Class: ': 'Item Class: ',
  'Item Level: ': 'Item Level: ',
  'Talisman Tier: ': 'Talisman Tier: ',
  'Level: ': 'Level: ',
  'Stack Size: ': 'Stack Size: ',
  'Sockets: ': 'Sockets: ',
  'Quality: ': 'Quality: ',
  'Physical Damage: ': 'Physical Damage: ',
  'Elemental Damage: ': 'Elemental Damage: ',
  'Critical Strike Chance: ': 'Critical Strike Chance: ',
  'Attacks per Second: ': 'Attacks per Second: ',
  'Armour: ': 'Armour: ',
  'Evasion Rating: ': 'Evasion Rating: ',
  'Energy Shield: ': 'Energy Shield: ',
  'Chance to Block: ': 'Chance to Block: ',
  'Corrupted': 'Corrupted',
  'Unidentified': 'Unidentified',
  '/^Superior (.*)$/': /^Superior (.*)$/,
  '/^Blighted (.*)$/': /^Blighted (.*)$/,
  'Shaper Item': 'Shaper Item',
  'Elder Item': 'Elder Item',
  'Crusader Item': 'Crusader Item',
  'Hunter Item': 'Hunter Item',
  'Redeemer Item': 'Redeemer Item',
  'Warlord Item': 'Warlord Item',
  'Synthesised Item': 'Synthesised Item',
  '/^Synthesised (.*)$/': /^Synthesised (.*)$/,
  '/^Vaal .*$/': /^Vaal .*$/,
  'VEILED_PREFIX': 'Veiled Prefix',
  'VEILED_SUFFIX': 'Veiled Suffix',
  '/^Currently has \\d+ Charges$/': /^Currently has \d+ Charges$/,
  '/^Spawns a Level (\\d+) Monster when Harvested$/': /^Spawns a Level (\d+) Monster when Harvested$/,
  'Right-click this item then left-click the ground to plant it in the Sacred Grove.': 'Right-click this item then left-click the ground to plant it in the Sacred Grove.',
  "Combine this with four other different samples in Tane's Laboratory.": "Combine this with four other different samples in Tane's Laboratory.",
  'Right-click to add this to your bestiary.': 'Right-click to add this to your bestiary.',
  'Right-click to add this prophecy to your character.': 'Right-click to add this prophecy to your character.',
  '/^.* Brain$/': /^.* Brain$/,
  '/^.* Eye$/': /^.* Eye$/,
  '/^.* Lung$/': /^.* Lung$/,
  '/^.* Heart$/': /^.* Heart$/,
  '/^.* Liver$/': /^.* Liver$/,
  'You will find Alva and complete her mission.': 'You will find Alva and complete her mission.',
  'You will find Einhar and complete his mission.': 'You will find Einhar and complete his mission.',
  'You will find Niko and complete his mission.': 'You will find Niko and complete his mission.',
  'You will find Jun and complete her mission.': 'You will find Jun and complete her mission.',
  'You will find Zana and complete her mission.': 'You will find Zana and complete her mission.',
  'Blighted {0}': 'Blighted {0}',
  'You cannot use this item. Its stats will be ignored': 'You cannot use this item. Its stats will be ignored',
  '/^Anomalous (.*)$/': /^Anomalous (.*)$/,
  '/^Divergent (.*)$/': /^Divergent (.*)$/,
  '/^Phantasmal (.*)$/': /^Phantasmal (.*)$/,
  '/^Requires (.+) \\(Level (\\d+)\\)$/': /^Requires (?<job>.+) \(Level (?<level>\d+)\)$/,
  'Area Level: ': 'Area Level: ',
  'Lockpicking': 'Lockpicking',
  'Counter-Thaumaturgy': 'Counter-Thaumaturgy',
  'Perception': 'Perception',
  'Deception': 'Deception',
  'Agility': 'Agility',
  'Engineering': 'Engineering',
  'Trap Disarmament': 'Trap Disarmament',
  'Demolition': 'Demolition',
  'Brute Force': 'Brute Force',
  'Mirrored': 'Mirrored',
  'MODIFIER_LINE': /^(?<type>[^"]+)(?:\s+"(?<name>[^"]+)")?(?:\s+\(Tier: (?<tier>\d+)\))?(?:\s+\(Rank: (?<rank>\d+)\))?$/,
  'PREFIX_MODIFIER': 'Prefix Modifier',
  'SUFFIX_MODIFIER': 'Suffix Modifier',
  'CRAFTED_PREFIX': 'Master Crafted Prefix Modifier',
  'CRAFTED_SUFFIX': 'Master Crafted Suffix Modifier',
  'UNSCALABLE_VALUE': ' — Unscalable Value'
}

export default dict

export type TranslationDict = typeof dict
