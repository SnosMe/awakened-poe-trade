// itemTextToSections.test.ts
import { __testExports } from "@/parser/Parser";
import { beforeEach, describe } from "node:test";
import { expect, test, vi } from "vitest";

describe("itemTextToSections", () => {
  test("empty string should not throw", () => {
    expect(() => __testExports.itemTextToSections("")).not.toThrow();
  });
  test("standard item", () => {
    const sections = __testExports.itemTextToSections(
      `Item Class: Staves
Rarity: Magic
Chiming Staff of Havoc
--------
Requirements:
Level: 58
Int: 133 (unmet)
--------
Item Level: 62
--------
+5 to Level of all Chaos Spell Skills
`,
    );
    expect(sections.length).toBe(4);
  });
});
