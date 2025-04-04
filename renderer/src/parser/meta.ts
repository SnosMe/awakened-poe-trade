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
  OneHandedAxe = "One Hand Axe",
  TwoHandedAxe = "Two Hand Axe",
  OneHandedMace = "One Hand Mace",
  TwoHandedMace = "Two Hand Mace",
  OneHandedSword = "One Hand Sword",
  TwoHandedSword = "Two Hand Sword",
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
  Waystone = "Waystone",
  Relic = "Relic",
  Tablet = "Tablet",
  TowerAugment = "TowerAugment",
  Spear = "Spear",
  Flail = "Flail",
}

export const WEAPON_ONE_HANDED_MELEE = new Set([
  ItemCategory.OneHandedAxe,
  ItemCategory.OneHandedMace,
  ItemCategory.OneHandedSword,
  ItemCategory.Claw,
  ItemCategory.Dagger,
  ItemCategory.RuneDagger,
  // TODO: confirm that these are actually melee weapons
  ItemCategory.Spear,
  ItemCategory.Flail,
]);

export const WEAPON_ONE_HANDED = new Set([
  ItemCategory.Sceptre,
  ItemCategory.Wand,
  ...WEAPON_ONE_HANDED_MELEE,
]);

export const WEAPON_TWO_HANDED_MELEE = new Set([
  ItemCategory.TwoHandedAxe,
  ItemCategory.TwoHandedMace,
  ItemCategory.TwoHandedSword,
  ItemCategory.Warstaff,
]);

export const MARTIAL_WEAPON = new Set([
  ItemCategory.Bow,
  ItemCategory.Crossbow,
  ...WEAPON_ONE_HANDED_MELEE,
  ...WEAPON_TWO_HANDED_MELEE,
]);

export const WEAPON = new Set([
  ItemCategory.Staff,
  ItemCategory.FishingRod,
  ...WEAPON_ONE_HANDED,
  ...MARTIAL_WEAPON,
]);

export const ARMOUR = new Set([
  ItemCategory.BodyArmour,
  ItemCategory.Boots,
  ItemCategory.Gloves,
  ItemCategory.Helmet,
  ItemCategory.Shield,
  ItemCategory.Focus,
]);

export const ACCESSORY = new Set([
  ItemCategory.Amulet,
  ItemCategory.Belt,
  ItemCategory.Ring,
  ItemCategory.Trinket,
  // ItemCategory.Quiver
]);

export enum ItemEditorType {
  Rune = "rune",
  Catalyst = "catalyst",
  None = "none",
}
