import { ParsedItem } from "@/parser";
import { RuneFilter } from "./interfaces";

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
        rune: rune.rune,
        isEmpty: rune.isEmpty,
        text: rune.text,
        disabled: false,
      });
    }
  }

  return filters;
}
