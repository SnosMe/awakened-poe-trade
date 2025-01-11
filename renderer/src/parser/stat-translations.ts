import { CLIENT_STRINGS as _$, STAT_BY_MATCH_STR } from "@/assets/data";
import type { StatMatcher, Stat } from "@/assets/data";
import { ModifierType } from "./modifiers";
import { ItemCategory } from "./meta";
import { getModTier, getTier, getTierNumber } from "./mod-tiers";
import { ItemRarity, ParsedItem } from "./ParsedItem";

// This file is a little messy and scary,
// but that's how stats translations are parsed :-D

const LOCALIZED_PAREN_LEFT = /^\s*(?:\(|（)/;
const LOCALIZED_PAREN_RIGHT = /(?:\)|）)\s*$/;

export interface ParsedStat {
  readonly stat: Stat;
  readonly translation: StatMatcher;
  roll?: {
    unscalable: boolean;
    legacy?: true;
    dp: boolean;
    value: number;
    min: number;
    max: number;
  };
}

interface StatString {
  string: string;
  unscalable: boolean;
}

export function* linesToStatStrings(
  lines: string[],
): Generator<StatString, string[], boolean> {
  const notParsedLines: string[] = [];

  let reminderString = false;

  outer: for (let start = 0; start < lines.length; start += 1) {
    if (lines[start].match(LOCALIZED_PAREN_LEFT)) {
      reminderString = true;
    }
    if (reminderString && lines[start].match(LOCALIZED_PAREN_RIGHT)) {
      reminderString = false;
      continue;
    }
    if (reminderString) {
      continue;
    }

    for (let end = start; end < lines.length; end += 1) {
      let str = lines.slice(start, end + 1).join("\n");

      const unscalable = str.endsWith(_$.UNSCALABLE_VALUE);
      if (unscalable) {
        str = str.slice(0, -_$.UNSCALABLE_VALUE.length);
      }

      const isParsed: boolean = yield { string: str, unscalable };
      if (isParsed) {
        start += end - start;
        continue outer;
      }
    }
    notParsedLines.push(lines[start]);
  }
  return notParsedLines;
}

const PLACEHOLDER_MAP = [
  // 0 # -> max 0 #
  [[]],
  // 1 # -> max 1 #
  [[0], []],
  // 2 # -> max 2 #
  [[0, 1], [0], [1], []],
  // 3 # -> max 2 #
  [[0, 1, 2], [1, 2], [0, 2], [0, 1], [2], [1], [0]],
  // 4 # -> max 2 #
  [
    [0, 1, 2, 3],
    [1, 2, 3],
    [0, 2, 3],
    [0, 1, 3],
    [0, 1, 2],
    [2, 3],
    [1, 3],
    [1, 2],
    [0, 3],
    [0, 2],
    [0, 1],
  ],
];

function* _statPlaceholderGenerator(stat: string) {
  const matches: Array<{
    roll: number;
    rollStr: string;
    decimal: boolean;
    bounds?: { min: number; max: number };
  }> = [];
  const withPlaceholders = stat
    .replace(/\(\)/gm, "") // when GGG didn't provide advanced desc, like in "Passives in Radius of Wicked Ward() can be Allocated"
    .replace(
      /(?<value>(?<!\d|\))[+-]?\d+(?:\.\d+)?)(?:\((?<min>.[^)-]*)(?:-(?<max>[^)]+))?\))?/gm,
      (_, roll: string, min?: string, max?: string) => {
        if (min != null && max == null) {
          // example: Sextant "# uses remaining", legacy rolls
          max = min;
        }

        const captured: (typeof matches)[number] = {
          roll: Number(roll),
          rollStr: roll,
          decimal:
            roll.includes(".") ||
            min?.includes(".") ||
            max?.includes(".") ||
            false,
          bounds: { min: Number(min), max: Number(max) },
        };
        matches.push(captured);

        if (
          Number.isNaN(captured.bounds!.min) ||
          Number.isNaN(captured.bounds!.max)
        ) {
          captured.bounds = undefined;
          return min != null ? `#(${min}-${max})` : "#";
        } else {
          return "#";
        }
      },
    );

  if (matches.length < PLACEHOLDER_MAP.length) {
    for (const replacements of PLACEHOLDER_MAP[matches.length]) {
      let idx = -1;
      const replaced = withPlaceholders.replace(/#/gm, () => {
        idx += 1;
        return replacements.includes(idx) ? matches[idx].rollStr : "#";
      });

      yield {
        stat: replaced,
        values: matches.filter(
          (_, idx) => !replacements.includes(idx),
        ) as Array<
          Pick<(typeof matches)[number], "roll" | "bounds" | "decimal">
        >,
      };
    }
  }

  // fallback to exact stat text, without any placeholders
  // N # -> max 0 #
  yield { stat, values: [] };
}

export function tryParseTranslation(
  stat: StatString,
  modType: ModifierType,
  item?: ParsedItem,
): { stat: ParsedStat; tier: number | undefined } | undefined {
  let itemRarity: ItemRarity | undefined;
  let itemCategory: ItemCategory | undefined;
  if (item) {
    itemRarity = item.rarity;
    itemCategory = item.category;
  }
  for (const combination of _statPlaceholderGenerator(stat.string)) {
    const found = STAT_BY_MATCH_STR(combination.stat);
    if (!found || !found.stat.trade.ids || !found.stat.trade.ids[modType]) {
      continue;
    }

    // Modifiers must be upgraded to the new values with a Divine Orb
    let legacyStatRolls = false;

    if (found.matcher.negate) {
      for (const stat of combination.values) {
        stat.roll *= -1;
        if (stat.bounds) {
          stat.bounds.min *= -1;
          stat.bounds.max *= -1;
        }
      }
    }

    if (found.stat.ref === "# uses remaining") {
      const uses = combination.values[0];
      uses.bounds = {
        min: 1,
        max: uses.bounds?.max ?? uses.roll,
      };
    }

    let foundTier: number | undefined;

    if (
      modType === ModifierType.Explicit &&
      found.stat.tiers &&
      itemCategory &&
      itemRarity !== ItemRarity.Unique
    ) {
      const modTiers = getModTier(
        combination.values,
        found.stat.tiers,
        itemCategory,
        modType,
      );

      if (modTiers) {
        const tierMatch = getTier(combination.values, modTiers);
        if (tierMatch) {
          // Set bounds for each stat from the tier
          combination.values.forEach((stat, index) => {
            const tierBounds = tierMatch.values[index];
            if (tierBounds) {
              stat.bounds = {
                min: tierBounds[0],
                max: tierBounds[1],
              };
            }
          });
          const tierNumber = getTierNumber(tierMatch, modTiers, itemCategory, [
            modTiers,
          ]);
          if (tierNumber !== -1) {
            foundTier = tierNumber;
          }
        }
      }
    } else if (found.stat.tiers && itemRarity === ItemRarity.Unique && item) {
      if (found.stat.tiers.unique) {
        const uniqueName = item.info.refName;
        if (uniqueName in found.stat.tiers.unique) {
          const uniqueModValues = found.stat.tiers.unique[uniqueName];
          if (uniqueModValues) {
            combination.values.forEach((stat, index) => {
              const tierBounds = uniqueModValues[index];
              if (tierBounds) {
                stat.bounds = {
                  min: tierBounds[0],
                  max: tierBounds[1],
                };
              }
            });
          }
        }
      } else {
        if (item.info.refName === "Controlled Metamorphosis") {
          const matchedName = found.matcher.string;
          const matchers = found.stat.matchers.map((matcher) => matcher.string);
          const matcherValue = matchers.indexOf(matchedName) + 1;
          combination.values = [
            {
              roll: matcherValue,
              decimal: false,
              bounds: {
                min: 1,
                max: matchers.length,
              },
            },
          ];
        }
      }
    }

    for (const stat of combination.values) {
      if (!stat.bounds) continue;

      if (stat.bounds.min > stat.bounds.max) {
        // some stats granted by legacy Modifiers (not legacy rolls)
        // can have same stat translations as granted by new Modifiers
        // but swapped translation strings for positive and negative rolls
        stat.bounds = {
          max: stat.bounds.min,
          min: stat.bounds.max,
        };
        // don't consider them as a legacy rolls
      }

      if (stat.roll > stat.bounds.max) {
        stat.bounds.max = stat.roll;
        legacyStatRolls = true;
      }
      if (stat.roll < stat.bounds.min) {
        stat.bounds.min = stat.roll;
        legacyStatRolls = true;
      }
    }

    if (!combination.values.length && found.matcher.value) {
      combination.values = [
        {
          roll: found.matcher.value,
          decimal: false,
          bounds: {
            min: found.matcher.value,
            max: found.matcher.value,
          },
        },
      ];
    }

    return {
      stat: {
        stat: found.stat,
        translation: found.matcher,
        roll: combination.values.length
          ? {
              unscalable: stat.unscalable,
              legacy: legacyStatRolls || undefined,
              dp:
                found.stat.dp ||
                combination.values.some((stat) => stat.decimal),
              value: getRollOrMinmaxAvg(
                combination.values.map((stat) => stat.roll),
              ),
              min: getRollOrMinmaxAvg(
                combination.values.map((stat) => stat.bounds?.min ?? stat.roll),
              ),
              max: getRollOrMinmaxAvg(
                combination.values.map((stat) => stat.bounds?.max ?? stat.roll),
              ),
            }
          : undefined,
      },
      tier: foundTier,
    };
  }
}

export function getRollOrMinmaxAvg(values: number[]): number {
  if (values.length === 2) {
    return (values[0] + values[1]) / 2;
  } else {
    return values[0];
  }
}
