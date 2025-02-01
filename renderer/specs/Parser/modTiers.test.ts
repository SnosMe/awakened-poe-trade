import { expect, test, describe } from "vitest";
import { getModTier, getTier, getTierNumber } from "@/parser/mod-tiers";
import { ModifierType } from "@/parser/modifiers";
import { ItemCategory } from "@/parser";
import {
  addedFireDamageStat,
  gainManaOnKillStat,
  maxManaStat,
  strengthStat,
} from "../static";
import { setupTests } from "../vitest.setup";

describe("getModTier", () => {
  setupTests();
  test("If 'found' is undefined, should throw", () => {
    const values = [
      {
        roll: 10,
        decimal: false,
      },
    ];

    expect(() => {
      getModTier(
        values,
        undefined,
        ItemCategory.OneHandedSword,
        ModifierType.Explicit,
      );
    }).toThrow(Error);
  });

  test("If 'modType' is not in 'found', should throw", () => {
    const values = [
      {
        roll: 10,
        decimal: false,
      },
    ];

    expect(() => {
      getModTier(
        values,
        strengthStat,
        ItemCategory.OneHandedSword,
        ModifierType.Fractured,
      );
    }).toThrow(Error);
  });

  test("If item category is not found, should return first tier where roll in values", () => {
    const values = [
      {
        roll: 5,
        decimal: false,
      },
    ];
    expect(
      getModTier(
        values,
        strengthStat,
        ItemCategory.Quiver,
        ModifierType.Explicit,
      ),
    ).toEqual(strengthStat!.explicit[0]);
  });

  test.each(
    strengthStat!.explicit.flatMap((tier) =>
      tier.mods.flatMap((mod) => {
        const [min, max] = mod.values[0];
        // Create an array of test cases for each roll in the range for this mod
        return Array.from({ length: max - min + 1 }, (_, i) => ({
          roll: min + i,
          expectedTier: tier,
          modName: mod.name,
        }));
      }),
    ),
  )(
    "If roll is $roll, should return the correct tier",
    ({ roll, expectedTier }) => {
      const values = [
        {
          roll,
          decimal: false,
        },
      ];

      expect(
        getModTier(
          values,
          strengthStat,
          ItemCategory.Quiver, // Item category that won't match
          ModifierType.Explicit,
        ),
      ).toEqual(expectedTier);
    },
  );

  test("if roll is above of possible values, it should return the first mod tier", () => {
    const values = [
      {
        roll: 100,
        decimal: false,
      },
    ];
    expect(
      getModTier(
        values,
        strengthStat,
        ItemCategory.Quiver,
        ModifierType.Explicit,
      ),
    ).toEqual(strengthStat!.explicit[0]);
  });

  test("if roll is below of possible values, it should return the first mod tier", () => {
    const values = [
      {
        roll: 0,
        decimal: false,
      },
    ];
    expect(
      getModTier(
        values,
        strengthStat,
        ItemCategory.Quiver,
        ModifierType.Explicit,
      ),
    ).toEqual(strengthStat!.explicit[0]);
  });

  test("If multiple categories, should return the correct mod tier based on category", () => {
    const values = [
      {
        roll: 20,
        decimal: false,
      },
    ];
    expect(
      getModTier(values, maxManaStat, ItemCategory.Ring, ModifierType.Explicit),
    ).toEqual(maxManaStat!.explicit[0]);
  });

  test("If multiple categories and correct tier is the second one, should return the correct mod tier based on category", () => {
    const values = [
      {
        roll: 20,
        decimal: false,
      },
    ];
    expect(
      getModTier(
        values,
        maxManaStat,
        ItemCategory.Staff,
        ModifierType.Explicit,
      ),
    ).toEqual(maxManaStat!.explicit[1]);
  });

  test("If item is a weapon type that could be one or two handed should return the correct mod tier", () => {
    const values = [
      {
        roll: 20,
        decimal: false,
      },
    ];
    expect(
      getModTier(
        values,
        addedFireDamageStat,
        ItemCategory.TwoHandedMace,
        ModifierType.Explicit,
      ),
    ).toEqual(addedFireDamageStat!.explicit[0]);
    expect(
      getModTier(
        values,
        addedFireDamageStat,
        ItemCategory.OneHandedMace,
        ModifierType.Explicit,
      ),
    ).toEqual(addedFireDamageStat!.explicit[1]);
  });

  test("If item is weapon, it should be able to still return correct tier", () => {
    const values = [
      {
        roll: 5,
        decimal: false,
      },
    ];

    expect(
      getModTier(
        values,
        gainManaOnKillStat,
        ItemCategory.OneHandedSword,
        ModifierType.Explicit,
      ),
    ).toEqual(gainManaOnKillStat!.explicit[0]);
  });
});

describe("getTier", () => {
  setupTests();
  test.each(
    strengthStat!.explicit.flatMap((tier) =>
      tier.mods.flatMap((mod, modIndex) => {
        const [min, max] = mod.values[0];
        // Create an array of test cases for each roll in the range for this mod
        return Array.from({ length: max - min + 1 }, (_, i) => ({
          roll: min + i,
          expectedTier: tier,
          expectedMod: mod,
          modName: mod.name,
        }));
      }),
    ),
  )(
    "If roll is $roll, should return the correct tier and mod",
    ({ roll, expectedTier, expectedMod, modName }) => {
      const values = [
        {
          roll,
          decimal: false,
        },
      ];

      // Call getModTier to get the tier
      const actualTier = getModTier(
        values,
        strengthStat,
        ItemCategory.Quiver, // Item category that won't match
        ModifierType.Explicit,
      );

      expect(actualTier).toEqual(expectedTier);

      // Call getTier to verify the correct mod is returned
      const actualMod = getTier(values, actualTier);

      expect(actualMod).toEqual(expectedMod);
    },
  );
  test("If roll is below the lowest tier, should return the lowest tier", () => {
    const values = [
      {
        roll: 1,
        decimal: false,
      },
    ];

    const result = getTier(values, strengthStat!.explicit[0]);
    expect(result).toEqual(strengthStat!.explicit[0].mods[0]); // Should return "Tier1"
  });

  test("If roll is above the highest tier, should return the highest tier", () => {
    const values = [
      {
        roll: 999,
        decimal: false,
      },
    ];

    const result = getTier(values, strengthStat!.explicit[0]);
    expect(result).toEqual(strengthStat!.explicit[0].mods.at(-1)); // Should return "Tier3"
  });

  test("If roll is within bounds, should return the correct tier", () => {
    const values = [
      {
        roll: 18, // Within the bounds of "Tier2"
        decimal: false,
      },
    ];

    const result = getTier(values, strengthStat!.explicit[0]);
    expect(result).toEqual(strengthStat!.explicit[0].mods[3]); // Should return "Tier2"
  });
});

describe("getTierNumber", () => {
  setupTests();
  test("If tier is the first tier, should return total mods count - 1", () => {
    const tier = strengthStat!.explicit[0].mods[0];
    const mod = strengthStat!.explicit[0];
    const itemCategory = ItemCategory.OneHandedSword;
    const tierArray = strengthStat!.explicit;

    const result = getTierNumber(tier, mod, itemCategory, tierArray);
    expect(result?.poe1).toEqual(8);
  });
  test("If tier is the best, should be 1", () => {
    const tier = strengthStat!.explicit[0].mods.at(-1);
    const mod = strengthStat!.explicit[0];
    const itemCategory = ItemCategory.OneHandedSword;
    const tierArray = strengthStat!.explicit;

    const result = getTierNumber(tier!, mod, itemCategory, tierArray);
    expect(result?.poe1).toEqual(1);
  });
  test("If category not in items, should return -1", () => {
    const tier = strengthStat!.explicit[0].mods[0];
    const mod = strengthStat!.explicit[0];
    const itemCategory = ItemCategory.Quiver;
    const tierArray = strengthStat!.explicit;

    const result = getTierNumber(tier, mod, itemCategory, tierArray);
    expect(result).toBeUndefined();
  });
});
