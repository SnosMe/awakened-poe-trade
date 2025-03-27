import { ITEM_BY_REF, ITEM_BY_TRANSLATED } from "@/assets/data";
import { AppConfig } from "@/web/Config";

export function magicBasetype(name: string) {
  let separator = " ";
  if (AppConfig().language === "cmn-Hant") {
    separator = /[\u4e00-\u9fa5]/.test(name) ? "" : " ";
  }
  const words = name.split(separator);

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start)
      .fill(undefined)
      .map((_, idx) => words.slice(start, start + idx + 1).join(separator)),
  );

  const result = perm
    .map((name) => {
      // HACK: Remember to remove "by translated" when controller copy is fixed
      const result =
        ITEM_BY_REF("ITEM", name) ?? ITEM_BY_TRANSLATED("ITEM", name);
      return { name, found: result && result[0].craftable };
    })
    .filter((res) => res.found)
    .sort((a, b) => b.name.length - a.name.length);

  return result.length ? result[0].name : undefined;
}
