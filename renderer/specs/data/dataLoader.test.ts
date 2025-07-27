import { beforeEach, describe, expect, test } from "vitest";
import { setupTests } from "../vitest.setup";
import {
  __testExports,
  loadForLang,
  RUNE_DATA_BY_RUNE,
  setLocalRuneFilter,
  STAT_BY_REF,
} from "@/assets/data";

describe("runesToLookup", () => {
  setupTests();

  beforeEach(async () => {
    // Set a filter that allows all runes to pass through.
    setLocalRuneFilter((value, index, array) => true);
    // Load the language data required for the tests.
    await loadForLang("en");
  });

  test("empty list should not throw", () => {
    expect(() => __testExports.runesToLookup([])).not.toThrow();
  });
  test("Searching Iron rune should give 2 types", () => {
    RUNE_DATA_BY_RUNE["Iron Rune"].forEach((rune) => {
      expect(rune.rune).toBe("Iron Rune");
    });
    expect(RUNE_DATA_BY_RUNE["Iron Rune"].length).toBe(2);
  });
  test("Random stats should be present", () => {
    expect(STAT_BY_REF("Adds # to # Physical Damage")).toBeTruthy();
    expect(STAT_BY_REF("Adds # to # Lightning Damage")).toBeTruthy();
    expect(STAT_BY_REF("#% to Fire Resistance")).toBeTruthy();
    expect(STAT_BY_REF("Knockback direction is reversed")).toBeTruthy();

    expect(
      STAT_BY_REF("Regenerate # Life per second per Maximum Energy Shield"),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Increases and Reductions to Minion Attack Speed also affect you",
      ),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Notable Passive Skills in Radius also grant Projectiles have #% chance for an additional Projectile when Forking",
      ),
    ).toBeTruthy();
    expect(
      STAT_BY_REF("Every Rage also grants #% increased Armour"),
    ).toBeTruthy();
    expect(
      STAT_BY_REF(
        "Recover #% of maximum Life for each Endurance Charge consumed",
      ),
    ).toBeTruthy();
    expect(STAT_BY_REF("#% increased Freeze Buildup")).toBeTruthy();
    expect(STAT_BY_REF("Has Purple Smoke")).toBeTruthy();
    expect(
      STAT_BY_REF("On Corruption, Item gains two Enchantments"),
    ).toBeTruthy();
  });
});
