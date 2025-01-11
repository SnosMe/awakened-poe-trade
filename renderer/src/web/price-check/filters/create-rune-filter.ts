import { ItemRarity, ParsedItem } from "@/parser";
import { RuneFilter } from "./interfaces";
import { Rune } from "@/parser/ParsedItem";

export function createRuneFilters(
  item: ParsedItem,
  runeSockets: ParsedItem["runeSockets"],
  opts: { league: string },
): RuneFilter[] {
  const filters: RuneFilter[] = [];
  if (!runeSockets) return filters;

  if (runeSockets.total !== runeSockets.runes.length) {
    console.warn(
      `Total rune sockets (${runeSockets.total}) does not match actual rune sockets (${runeSockets.runes.length})`,
    );
  }

  if (runeSockets.runes.length) {
    for (const rune of runeSockets.runes) {
      filters.push({
        index: rune.index,
        rune: rune.rune,
        isEmpty: rune.isEmpty,
        text: rune.text,
        disabled: shouldRuneBeDisabled(rune, item.rarity),
        isFake: rune.isFake ?? false,
      });
    }
  }

  return filters;
}

function shouldRuneBeDisabled(rune: Rune, rarity?: ItemRarity) {
  if (rarity === ItemRarity.Unique) {
    return false;
  } else {
    return rune.isEmpty && !(rune.isFake ?? false);
  }
}
