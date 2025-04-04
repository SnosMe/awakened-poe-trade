import { describe, expect, test } from "vitest";
import { setupTests } from "../vitest.setup";
import { __testExports, RUNE_DATA_BY_RUNE } from "@/assets/data";

describe("runesToLookup", () => {
  setupTests();
  test("empty list should not throw", () => {
    expect(() => __testExports.runesToLookup([])).not.toThrow();
  });
  test("Searching Iron rune should give 2 types", () => {
    RUNE_DATA_BY_RUNE["Iron Rune"].forEach((rune) => {
      expect(rune.rune).toBe("Iron Rune");
    });
  });
});
