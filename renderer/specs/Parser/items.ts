import { BaseType } from "@/assets/data";
import { ItemCategory, ItemInfluence, ItemRarity, ParsedItem } from "@/parser";
import { ParsedModifier } from "@/parser/advanced-mod-desc";
import { StatCalculated, ModifierType } from "@/parser/modifiers";

class TestItem implements ParsedItem {
  // #region ParsedItem
  rarity?: ItemRarity | undefined;
  itemLevel?: number | undefined;
  armourAR?: number | undefined;
  armourEV?: number | undefined;
  armourES?: number | undefined;
  armourBLOCK?: number | undefined;
  basePercentile?: number | undefined;
  weaponCRIT?: number | undefined;
  weaponAS?: number | undefined;
  weaponPHYSICAL?: number | undefined;
  weaponELEMENTAL?: number | undefined;
  weaponFIRE?: number | undefined;
  weaponCOLD?: number | undefined;
  weaponLIGHTNING?: number | undefined;
  weaponChaos?: number | undefined;
  weaponReload?: number | undefined;
  mapBlighted?: "Blighted" | "Blight-ravaged" | undefined;
  mapTier?: number | undefined;
  gemLevel?: number | undefined;
  areaLevel?: number | undefined;
  talismanTier?: number | undefined;
  quality?: number | undefined;
  runeSockets?:
    | {
        empty: number;
        current: number;
        normal: number;
      }
    | undefined;

  gemSockets?: { number: number; linked?: number; white: number } | undefined;
  stackSize?: { value: number; max: number } | undefined;
  isUnidentified: boolean = false;
  isCorrupted: boolean = false;
  isUnmodifiable?: boolean | undefined;
  isMirrored?: boolean | undefined;
  influences: ItemInfluence[] = [];
  logbookAreaMods?: ParsedModifier[][] | undefined;
  sentinelCharge?: number | undefined;
  isSynthesised?: boolean | undefined;
  isFractured?: boolean | undefined;
  isVeiled?: boolean | undefined;
  isFoil?: boolean | undefined;
  statsByType: StatCalculated[] = [];
  newMods: ParsedModifier[] = [];
  unknownModifiers: Array<{ text: string; type: ModifierType }> = [];
  heist?:
    | {
        wingsRevealed?: number;
        target?: "Enchants" | "Trinkets" | "Gems" | "Replicas";
      }
    | undefined;

  category?: ItemCategory | undefined;
  info: BaseType = {
    name: "test",
    refName: "test",
    namespace: "ITEM",
    icon: "test",
    tags: [],
  };

  rawText: string;
  fromChat?: boolean | undefined;

  // #endregion

  public get affixCount() {
    return (
      this.prefixCount +
      this.suffixCount +
      this.uniqueAffixCount +
      this.implicitCount +
      this.enchantCount
    );
  }

  public get explicitCount() {
    return this.prefixCount + this.suffixCount + this.uniqueAffixCount;
  }

  prefixCount: number = 0;
  suffixCount: number = 0;
  implicitCount: number = 0;
  enchantCount: number = 0;
  uniqueAffixCount: number = 0;
  rollingUniqueAffixCount: number = 0;

  sectionCount: number = 0;

  constructor(text: string) {
    this.rawText = text;
  }
}

// #region NormalItem
export const NormalItem = new TestItem(`Item Class: Helmets
Rarity: Normal
Superior Divine Crown
--------
Quality: +9% (augmented)
Armour: 174 (augmented)
Energy Shield: 60 (augmented)
--------
Requires: Level 75, 67 (augmented) Str, 67 (augmented) Int
--------
Item Level: 81
`);
NormalItem.category = ItemCategory.Helmet;
NormalItem.rarity = ItemRarity.Normal;
NormalItem.quality = 9;
NormalItem.armourAR = 174;
NormalItem.armourES = 60;
NormalItem.itemLevel = 81;

NormalItem.sectionCount = 4;
// #endregion

// #region MagicItem
export const MagicItem = new TestItem(`Item Class: Two Hand Maces
Rarity: Magic
Crackling Temple Maul of the Brute
--------
Physical Damage: 35-72
Lightning Damage: 1-50 (lightning)
Critical Hit Chance: 5.00%
Attacks per Second: 1.20
--------
Requires: Level 28, 57 (augmented) Str
--------
Item Level: 32
--------
{ Prefix Modifier "Crackling" (Tier: 7) — Damage, Elemental, Lightning, Attack }
Adds 1(1-4) to 50(46-66) Lightning Damage
{ Suffix Modifier "of the Brute" (Tier: 8) — Attribute }
+8(5-8) to Strength
`);
MagicItem.category = ItemCategory.TwoHandedMace;
MagicItem.rarity = ItemRarity.Magic;
MagicItem.weaponPHYSICAL = 53.5;
MagicItem.weaponLIGHTNING = 25.5;
MagicItem.weaponCRIT = 5;
MagicItem.weaponAS = 1.2;
MagicItem.itemLevel = 32;

MagicItem.sectionCount = 5;
MagicItem.prefixCount = 1;
MagicItem.suffixCount = 1;
// #endregion

// #region RareItem
export const RareItem = new TestItem(`Item Class: Bows
Rarity: Rare
Oblivion Strike
Rider Bow
--------
Physical Damage: 36-61
Elemental Damage: 27-36 (fire), 9-13 (cold), 5-82 (lightning)
Critical Hit Chance: 5.00%
Attacks per Second: 1.20
--------
Requires: Level 51, 103 (augmented) Dex
--------
Item Level: 80
--------
{ Prefix Modifier "Shocking" (Tier: 4) — Damage, Elemental, Lightning, Attack }
Adds 5(1-5) to 82(62-89) Lightning Damage
{ Prefix Modifier "Scorching" (Tier: 5) — Damage, Elemental, Fire, Attack }
Adds 27(20-30) to 36(31-46) Fire Damage
{ Prefix Modifier "Icy" (Tier: 8) — Damage, Elemental, Cold, Attack }
Adds 9(6-9) to 13(10-15) Cold Damage
{ Suffix Modifier "of Radiance" (Tier: 1) — Attack }
+57(41-60) to Accuracy Rating
15% increased Light Radius
`);
RareItem.category = ItemCategory.Bow;
RareItem.rarity = ItemRarity.Rare;
RareItem.weaponPHYSICAL = 48.5;
RareItem.weaponFIRE = 31.5;
RareItem.weaponCOLD = 11;
RareItem.weaponLIGHTNING = 43.5;
RareItem.weaponELEMENTAL =
  RareItem.weaponFIRE + RareItem.weaponCOLD + RareItem.weaponLIGHTNING;
RareItem.itemLevel = 80;

RareItem.sectionCount = 5;
RareItem.prefixCount = 3;
RareItem.suffixCount = 1;
// #endregion

// #region UniqueItem
export const UniqueItem = new TestItem(`Item Class: Foci
Rarity: Unique
The Eternal Spark
Crystal Focus
--------
Energy Shield: 44 (augmented)
--------
Requires: Level 26, 43 (augmented) Int
--------
Item Level: 81
--------
{ Unique Modifier — Defences }
56(50-70)% increased Energy Shield
{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate while stationary
{ Unique Modifier — Elemental, Lightning, Resistance }
+26(20-30)% to Lightning Resistance
{ Unique Modifier — Elemental, Lightning, Resistance }
+5% to Maximum Lightning Resistance
{ Unique Modifier — Mana }
40% increased Mana Regeneration Rate
--------
A flash of blue, a stormcloud's kiss,
her motionless dance the pulse of bliss
`);
UniqueItem.category = ItemCategory.Focus;
UniqueItem.rarity = ItemRarity.Unique;
UniqueItem.armourES = 44;
UniqueItem.itemLevel = 81;

UniqueItem.sectionCount = 6;
UniqueItem.uniqueAffixCount = 5;
UniqueItem.rollingUniqueAffixCount = 2;
// #endregion

// #region RareWithImplicit
export const RareWithImplicit = new TestItem(`Item Class: Rings
Rarity: Rare
Rune Loop
Prismatic Ring
--------
Requires: Level 45
--------
Item Level: 79
--------
{ Implicit Modifier — Elemental, Fire, Cold, Lightning, Resistance }
+8(7-10)% to all Elemental Resistances (implicit)
--------
{ Prefix Modifier "Vaporous" (Tier: 3) — Defences }
+143(124-151) to Evasion Rating
{ Suffix Modifier "of the Wrestler" (Tier: 7) — Attribute }
+12(9-12) to Strength
{ Suffix Modifier "of Warmth" (Tier: 3) — Mana }
8(8-12)% increased Mana Regeneration Rate
5% increased Light Radius
{ Suffix Modifier "of the Penguin" (Tier: 7) — Elemental, Cold, Resistance }
+15(11-15)% to Cold Resistance
`);
RareWithImplicit.category = ItemCategory.Ring;
RareWithImplicit.rarity = ItemRarity.Rare;
RareWithImplicit.itemLevel = 79;

RareWithImplicit.sectionCount = 5;
RareWithImplicit.implicitCount = 1;
RareWithImplicit.prefixCount = 1;
RareWithImplicit.suffixCount = 3;
// #endregion

// #region UncutSkillGem
export const UncutSkillGem = new TestItem(`Rarity: Currency
Uncut Skill Gem
--------
Level: 19
--------
Item Level: 19
--------
Creates a Skill Gem or Level an existing gem to level 19
--------
Right Click to engrave a Skill Gem.
`);
UncutSkillGem.category = ItemCategory.UncutGem;
UncutSkillGem.gemLevel = 19;
UncutSkillGem.info = {
  name: "Uncut Skill Gem",
  refName: "Uncut Skill Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.UncutGem },
};

UncutSkillGem.sectionCount = 5;
// #endregion

// #region UncutSpiritGem
export const UncutSpiritGem = new TestItem(`Rarity: Currency
Uncut Spirit Gem
--------
Level: 19
--------
Item Level: 19
--------
Creates a Persistent Buff Skill Gem or Level an existing gem to Level 19
--------
Right Click to engrave a Persistent Buff Skill Gem.
`);
UncutSpiritGem.category = ItemCategory.UncutGem;
UncutSpiritGem.gemLevel = 19;
UncutSpiritGem.info = {
  name: "Uncut Spirit Gem",
  refName: "Uncut Spirit Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.UncutGem },
};

UncutSpiritGem.sectionCount = 5;
// #endregion

// #region UncutSupportGem
export const UncutSupportGem = new TestItem(`Rarity: Currency
Uncut Support Gem
--------
Level: 3
--------
Item Level: 3
--------
Creates a Support Gem up to level 3
--------
Right Click to engrave a Support Gem.
`);
UncutSupportGem.category = ItemCategory.UncutGem;
UncutSupportGem.gemLevel = 3;
UncutSupportGem.info = {
  name: "Uncut Spirit Gem",
  refName: "Uncut Spirit Gem",
  namespace: "ITEM",
  icon: "test",
  tags: [],
  craftable: { category: ItemCategory.UncutGem },
};

UncutSupportGem.sectionCount = 5;
// #endregion
