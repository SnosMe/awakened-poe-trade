// itemTextToSections.test.ts
import { __testExports } from "@/parser/Parser";
import { beforeEach, describe, expect, test } from "vitest";
import { setupTests } from "../vitest.setup";
import {
  MagicItem,
  NormalItem,
  RareItem,
  RareWithImplicit,
  UniqueItem,
} from "./items";
import { loadForLang } from "@/assets/data";

describe("itemTextToSections", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("empty string should not throw", () => {
    expect(() => __testExports.itemTextToSections("")).not.toThrow();
  });
  test("standard item", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    expect(sections.length).toBe(RareItem.sectionCount);
  });
  test("magic item", () => {
    const sections = __testExports.itemTextToSections(MagicItem.rawText);
    expect(sections.length).toBe(MagicItem.sectionCount);
  });
  test("normal item", () => {
    const sections = __testExports.itemTextToSections(NormalItem.rawText);
    expect(sections.length).toBe(NormalItem.sectionCount);
  });
  test("unique item", () => {
    const sections = __testExports.itemTextToSections(UniqueItem.rawText);
    expect(sections.length).toBe(UniqueItem.sectionCount);
  });
  test("rare item with implicit", () => {
    const sections = __testExports.itemTextToSections(RareWithImplicit.rawText);
    expect(sections.length).toBe(RareWithImplicit.sectionCount);
  });
});
