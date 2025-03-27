import { MAX_TIER_LOOKUP, StatTierMod } from "@/assets/data";
import { ItemCategory } from "./meta";

export function mapItemCategoryToKeys(itemCategory: ItemCategory): string[] {
  const categoryMap: Record<ItemCategory, string[]> = {
    [ItemCategory.OneHandedSword]: ["sword", "one_hand_weapon", "weapon"],
    [ItemCategory.TwoHandedSword]: ["sword", "two_hand_weapon", "weapon"],
    [ItemCategory.Staff]: ["staff", "two_hand_weapon", "weapon"],
    [ItemCategory.Ring]: ["ring"],
    [ItemCategory.Quiver]: ["quiver", "one_hand_weapon", "weapon"],
    [ItemCategory.Map]: [""],
    [ItemCategory.CapturedBeast]: [""],
    [ItemCategory.MetamorphSample]: [""],
    [ItemCategory.Helmet]: ["helmet", "armour"],
    [ItemCategory.BodyArmour]: ["body_armour", "armour"],
    [ItemCategory.Gloves]: ["gloves", "armour"],
    [ItemCategory.Boots]: ["boots", "armour"],
    [ItemCategory.Shield]: ["shield", "armour"],
    [ItemCategory.Amulet]: ["amulet"],
    [ItemCategory.Belt]: ["belt"],
    [ItemCategory.Flask]: ["flask"],
    [ItemCategory.AbyssJewel]: ["jewel"],
    [ItemCategory.Jewel]: ["jewel"],
    [ItemCategory.Claw]: ["claw", "one_hand_weapon", "weapon"],
    [ItemCategory.Bow]: ["bow", "one_hand_weapon", "weapon"],
    [ItemCategory.Sceptre]: ["sceptre", "two_hand_weapon", "weapon"],
    [ItemCategory.Wand]: ["wand", "one_hand_weapon", "weapon"],
    [ItemCategory.FishingRod]: ["weapon"],
    [ItemCategory.Warstaff]: ["warstaff", "two_hand_weapon", "weapon"],
    [ItemCategory.Dagger]: ["dagger", "one_hand_weapon", "weapon"],
    [ItemCategory.RuneDagger]: ["rune_dagger", "one_hand_weapon", "weapon"],
    [ItemCategory.OneHandedAxe]: ["axe", "one_hand_weapon", "weapon"],
    [ItemCategory.TwoHandedAxe]: ["axe", "two_hand_weapon", "weapon"],
    [ItemCategory.OneHandedMace]: ["mace", "one_hand_weapon", "weapon"],
    [ItemCategory.TwoHandedMace]: ["mace", "two_hand_weapon", "weapon"],
    [ItemCategory.ClusterJewel]: ["jewel"],
    [ItemCategory.HeistBlueprint]: [""],
    [ItemCategory.HeistContract]: [""],
    [ItemCategory.HeistTool]: [""],
    [ItemCategory.HeistBrooch]: [""],
    [ItemCategory.HeistGear]: [""],
    [ItemCategory.HeistCloak]: [""],
    [ItemCategory.Trinket]: [""],
    [ItemCategory.Invitation]: [""],
    [ItemCategory.Gem]: ["gem"],
    [ItemCategory.Currency]: [""],
    [ItemCategory.DivinationCard]: [""],
    [ItemCategory.Voidstone]: [""],
    [ItemCategory.Sentinel]: [""],
    [ItemCategory.MemoryLine]: [""],
    [ItemCategory.SanctumRelic]: [""],
    [ItemCategory.Tincture]: [""],
    [ItemCategory.Charm]: [""],
    [ItemCategory.Crossbow]: ["crossbow", "two_hand_weapon", "weapon"],
    [ItemCategory.SkillGem]: [""],
    [ItemCategory.SupportGem]: [""],
    [ItemCategory.MetaGem]: [""],
    [ItemCategory.Focus]: ["focus", "armour"],
    [ItemCategory.Waystone]: [""],
    [ItemCategory.Relic]: [""],
    [ItemCategory.Tablet]: [""],
    [ItemCategory.TowerAugment]: [""],
    [ItemCategory.Spear]: ["spear", "one_hand_weapon", "weapon"],
    [ItemCategory.Flail]: ["flail", "one_hand_weapon", "weapon"],
  };

  return categoryMap[itemCategory] || [itemCategory.toLowerCase()];
}

export function getMaxTier(
  lookUpRef: string,
  category: ItemCategory,
): number | undefined {
  const tierLookup = MAX_TIER_LOOKUP[lookUpRef];
  if (!tierLookup) return;
  const categoryList = mapItemCategoryToKeys(category);
  for (const categoryKey of categoryList) {
    if (categoryKey in tierLookup) {
      return tierLookup[categoryKey];
    }
  }
}

export function findCategoryMatch(
  itemCategory: ItemCategory,
  tierArray: StatTierMod[],
  searchLevels: string[] = [],
): { match: StatTierMod | null; level: string | null } {
  let matchedTiers: StatTierMod[] = [];
  let matchingLevel = null;

  for (const level of searchLevels) {
    // Filter tiers that match the current search level
    matchedTiers = tierArray.filter((mod) => mod.items[level] !== undefined);

    if (matchedTiers.length > 0) {
      matchingLevel = level;

      // If only one match is found, stop searching
      if (matchedTiers.length === 1) {
        return { match: matchedTiers[0], level: matchingLevel };
      }
    }
  }

  // If multiple matches exist after all levels, return the first
  return { match: matchedTiers[0] || null, level: matchingLevel };
}
