import { Stat, StatTier, StatTierMod } from "@/assets/data";
import { ItemCategory } from "./meta";
import { ModifierType } from "./modifiers";

function mapItemCategoryToKeys(itemCategory: ItemCategory): string[] {
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
  };

  return categoryMap[itemCategory] || [itemCategory.toLowerCase()];
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
export function getModTier(
  values: Array<
    Pick<
      {
        roll: number;
        rollStr: string;
        decimal: boolean;
        bounds?: {
          min: number;
          max: number;
        };
      },
      "roll" | "bounds" | "decimal"
    >
  >,
  found: Stat["tiers"],
  itemCategory: ItemCategory,
  modType: ModifierType,
): StatTierMod {
  if (!found)
    throw new Error("Expected stat to have tiers, but none were found");

  if (modType in found) {
    const tier = found[modType as keyof Stat["tiers"]];

    // Normalize to an array of StatTierMod
    const tierArray: StatTierMod[] = Array.isArray(tier)
      ? tier
      : Object.values(tier);

    // Get the broad category key for the item category
    const { match: categoryMatch } = findCategoryMatch(
      itemCategory,
      tierArray,
      mapItemCategoryToKeys(itemCategory),
    );

    // Prioritize tiers matching the broader category
    // let categoryMatch = tierArray.find(
    //   (mod) => mod.items[categoryKey] !== undefined,
    // );

    // if (!categoryMatch) {
    //   // If no match for the broader category, fallback to individual matches
    //   categoryMatch = tierArray.find((mod) =>
    //     Object.keys(mod.items).some(
    //       (key) => key === itemCategory.toLowerCase(),
    //     ),
    //   );
    // }

    if (categoryMatch) {
      const tierMatch = categoryMatch.mods.find((t) =>
        values.every((stat, index) => {
          const tierBounds = t.values[index];
          return (
            tierBounds &&
            tierBounds[0] <= stat.roll &&
            stat.roll <= tierBounds[1]
          );
        }),
      );

      if (tierMatch) {
        // Set bounds for each stat from the matched tier
        values.forEach((stat, index) => {
          const tierBounds = tierMatch.values[index];
          if (tierBounds) {
            stat.bounds = {
              min: tierBounds[0],
              max: tierBounds[1],
            };
          }
        });
        return categoryMatch;
      }
    }

    // Fallback: Search through all StatTierMods
    for (const mod of tierArray) {
      const tierMatch = mod.mods.find((t) =>
        values.every((stat, index) => {
          const tierBounds = t.values[index];
          return (
            tierBounds &&
            tierBounds[0] <= stat.roll &&
            stat.roll <= tierBounds[1]
          );
        }),
      );

      if (tierMatch) {
        // Set bounds for each stat from the matched tier
        values.forEach((stat, index) => {
          const tierBounds = tierMatch.values[index];
          if (tierBounds) {
            stat.bounds = {
              min: tierBounds[0],
              max: tierBounds[1],
            };
          }
        });
        return mod;
      }
    }

    // If no match is found, return the first mod tier
    return tierArray[0];
  }

  throw new Error(
    `Expected stat to have tiers for ${modType}, but none were found`,
  );
}
export function getTier(
  values: Array<
    Pick<
      {
        roll: number;
        rollStr: string;
        decimal: boolean;
        bounds?: {
          min: number;
          max: number;
        };
      },
      "roll" | "bounds" | "decimal"
    >
  >,
  mod: StatTierMod,
): StatTier | undefined {
  if (mod === undefined || mod.mods === undefined || !mod.mods) {
    console.warn("No mods found for mod", mod);
    return undefined;
  }
  // Check for an exact match within bounds
  const tierMatch = mod.mods.find((t) =>
    values.every((stat, index) => {
      const tierBounds = t.values[index];
      return (
        tierBounds && tierBounds[0] <= stat.roll && stat.roll <= tierBounds[1]
      );
    }),
  );

  if (tierMatch) {
    return tierMatch;
  }

  // If no match, check if the roll is below the lowest tier
  const lowestTier = mod.mods[0];
  if (
    values.some((stat, index) => {
      const tierBounds = lowestTier.values[index];
      return tierBounds && stat.roll < tierBounds[0];
    })
  ) {
    return lowestTier;
  }

  // If no match, check if the roll is above the highest tier
  const highestTier = mod.mods[mod.mods.length - 1];
  if (
    values.some((stat, index) => {
      const tierBounds = highestTier.values[index];
      return tierBounds && stat.roll > tierBounds[1];
    })
  ) {
    return highestTier;
  }

  // No valid tier found
  return undefined;
}

export function findModCategoryMatch(
  itemCategory: ItemCategory,
  statTierMod: StatTierMod,
  searchLevels: string[] = [],
): { match: StatTier | null; level: string | null } {
  let matchedMods: StatTier[] = [];
  let matchingLevel: string | null = null;

  for (const level of searchLevels) {
    // Filter mods that match the current search level
    matchedMods = statTierMod.mods.filter((tier) => tier.items.includes(level));

    if (matchedMods.length > 0) {
      matchingLevel = level;

      // If only one match is found, stop searching
      if (matchedMods.length === 1) {
        return { match: matchedMods[0], level: matchingLevel };
      }
    }
  }

  // If multiple matches exist after all levels, return the first
  return { match: matchedMods[0] || null, level: matchingLevel };
}

export function getTierNumber(
  tier: StatTier,
  mod: StatTierMod,
  itemCategory: ItemCategory,
  tierArray: StatTierMod[],
): number {
  if (mod === undefined || mod.mods === undefined || !mod.mods) {
    console.warn("No mods found for mod", mod);
    return -1;
  }

  if (tier === undefined || itemCategory === undefined) {
    console.warn("No tier or itemCategory found");
    return -1;
  }

  // Map the itemCategory to its corresponding key(s)
  const { match: categoryExists, level: primaryCategoryKey } =
    findCategoryMatch(
      itemCategory,
      tierArray,
      mapItemCategoryToKeys(itemCategory),
    );

  if (!categoryExists || !primaryCategoryKey) {
    return -1; // Return -1 if the category is not found in any mod
  }

  // Find the index of the given tier in mod.mods
  const tierIndex = mod.mods.findIndex((t) => t.id === tier.id);

  if (tierIndex === -1) {
    throw new Error(`Tier not found in mod.mods for tier id: ${tier.id}`);
  }

  // Count the number of tiers after the found tier with the same itemCategory
  const matchingTiersAfter = mod.mods
    .slice(tierIndex + 1)
    .filter((t) => t.items.includes(primaryCategoryKey)).length;

  // Return the tier number (1-based)
  return matchingTiersAfter + 1;
}
