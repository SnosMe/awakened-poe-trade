import { expect, test } from "vitest";
import {
  CLIENT_STRINGS as _$,
  CLIENT_STRINGS_REF as _$REF,
  RUNE_SINGLE_VALUE,
  init,
} from "@/assets/data";
function sum(a: number, b: number) {
  return a + b;
}

test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});

test("loadForLang", async () => {
  await init("en");
  console.log(_$);
  console.log(_$REF);
  console.log(RUNE_SINGLE_VALUE["rune.stat_419810844"]);
});
