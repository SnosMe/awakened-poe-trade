import { magicBasetype } from "@/parser/magic-name";
import { beforeEach, describe, expect, test } from "vitest";
import { setupTests } from "../vitest.setup";
import { loadForLang } from "@/assets/data";

describe("Check Magic Name (en)", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("Should parse normal name", () => {
    const name = "Rattling Sceptre";
    expect(magicBasetype(name)).toBe("Rattling Sceptre");
  });
  test("Should parse magic name with suffix", () => {
    const name = "Cultist Greathammer of Nourishment";
    expect(magicBasetype(name)).toBe("Cultist Greathammer");
  });
  test("Should parse magic name with prefix", () => {
    const name = "Pulsing Antler Focus";
    expect(magicBasetype(name)).toBe("Antler Focus");
  });
  test("Should parse magic name with prefix and suffix", () => {
    const name = "Reaver's Temple Maul of Stunning";
    expect(magicBasetype(name)).toBe("Temple Maul");
  });
});

describe("Check Magic Name (cmn-Hant)", () => {
  beforeEach(async () => {
    setupTests({ language: "cmn-Hant" });
    await loadForLang("cmn-Hant");
  });
  test("Should parse normal name", () => {
    const name = "雜響權杖";
    expect(magicBasetype(name)).toBe("雜響權杖");
  });
  test("Should parse magic name with suffix", () => {
    const name = "營養之教徒巨錘";
    expect(magicBasetype(name)).toBe("教徒巨錘");
  });
  test("Should parse magic name with prefix", () => {
    const name = "脈衝的靈鹿法器";
    expect(magicBasetype(name)).toBe("靈鹿法器");
  });
  test("Should parse magic name with prefix and suffix", () => {
    const name = "掠奪者的擊暈之神殿重錘";
    expect(magicBasetype(name)).toBe("神殿重錘");
  });
});

describe("Check Magic Name (cmn-Hant) when UI returns english name", () => {
  beforeEach(async () => {
    setupTests({ language: "cmn-Hant" });
    await loadForLang("cmn-Hant");
  });
  test("Should parse normal name", () => {
    const name = "Rattling Sceptre";
    expect(magicBasetype(name)).toBe("Rattling Sceptre");
  });
  test("Should parse magic name with suffix", () => {
    const name = "Cultist Greathammer of Nourishment";
    expect(magicBasetype(name)).toBe("Cultist Greathammer");
  });
  test("Should parse magic name with prefix", () => {
    const name = "Pulsing Antler Focus";
    expect(magicBasetype(name)).toBe("Antler Focus");
  });
  test("Should parse magic name with prefix and suffix", () => {
    const name = "Reaver's Temple Maul of Stunning";
    expect(magicBasetype(name)).toBe("Temple Maul");
  });
});
