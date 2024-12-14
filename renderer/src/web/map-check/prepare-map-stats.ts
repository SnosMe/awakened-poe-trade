import { statSourcesTotal, translateStatWithRoll } from "@/parser/modifiers";
import { ParsedItem } from "@/parser/ParsedItem";
import { roundRoll } from "../price-check/filters/util";

export interface PreparedStat {
  matcher: string;
  roll?: number;
}

export function prepareMapStats(item: ParsedItem): PreparedStat[] {
  return item.statsByType.map((calc) => {
    const roll = statSourcesTotal(calc.sources);
    const translation = translateStatWithRoll(calc, roll);

    const prepared = {
      matcher: translation.string,
      roll: roll && roundRoll(roll.value, translation.dp ?? false),
    };

    if (translation.negate) {
      if (prepared.roll != null) {
        prepared.roll = -1 * prepared.roll;
      }
    }

    return prepared;
  });
}
