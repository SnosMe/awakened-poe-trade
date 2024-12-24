import { Stat } from "./data/interfaces-apt";
import { Stats } from "./vendor/client/tables/index";
import * as fs from "node:fs";
import * as path from "node:path";
import { API_STATS } from "./vendor/trade-api";
import { StatEntry } from "./vendor/trade-api/index-interfaces";

export function makeGeneratorStats(): (lang: string) => Stat[] {
  const stats = API_STATS();
  const statsFlattened = stats.flatMap((s) => s.entries);
  const addStatId = (s: StatEntry) => {
    return {
      ...s,
      statId: s.id.substring(s.type.length + 1),
      statIdNumber: s.id.substring(s.type.length + 1 + 5) as unknown as number,
    };
  };

  const statsWithStatId = statsFlattened.map(addStatId);

  const statsGroupedByStatId = statsWithStatId.reduce(
    (acc, curr) => {
      const statId = curr.statId;
      if (acc[statId]) {
        acc[statId].push(curr);
      } else {
        acc[statId] = [curr];
      }
      return acc;
    },
    {} as Record<string, StatEntry[]>,
  );

  const FormatRef = (ref: string) => {
    // Get all parts of string in [ ]

    let outString = "";

    for (let i = 0; i < ref.length; i++) {
      if (ref[i] === "[") {
        i++;
        let localOutString = "";
        while (ref[i] !== "]") {
          if (ref[i] === "|") {
            localOutString = "";
          } else {
            localOutString += ref[i];
          }
          i++;
        }
        outString += localOutString;
      } else {
        outString += ref[i];
      }
    }
    return outString;
  };

  return (lang: string) => {
    const statsArray: Stat[] = [];

    for (const statId in statsGroupedByStatId) {
      const statEntries = statsGroupedByStatId[statId];
      const combinedStat = {
        ref: FormatRef(statEntries[0].text),
        better: 0,
        matchers: [{ string: "StatMatcher" }],
        trade: {
          ids: {
            ...(statEntries.filter((e) => e.type == "explicit").length > 0 && {
              explicit: statEntries
                .filter((e) => e.type == "explicit")
                .map((e) => e.id),
            }),
            ...(statEntries.filter((e) => e.type == "implicit").length > 0 && {
              implicit: statEntries
                .filter((e) => e.type == "implicit")
                .map((e) => e.id),
            }),
            ...(statEntries.filter((e) => e.type == "fractured").length > 0 && {
              fractured: statEntries
                .filter((e) => e.type == "fractured")
                .map((e) => e.id),
            }),
            ...(statEntries.filter((e) => e.type == "scourge").length > 0 && {
              scourge: statEntries
                .filter((e) => e.type == "scourge")
                .map((e) => e.id),
            }),
            ...(statEntries.filter((e) => e.type == "crafted").length > 0 && {
              crafted: statEntries
                .filter((e) => e.type == "crafted")
                .map((e) => e.id),
            }),
            ...(statEntries.filter((e) => e.type == "pseudo").length > 0 && {
              pseudo: statEntries
                .filter((e) => e.type == "pseudo")
                .map((e) => e.id),
            }),
          },
        },
      };

      statsArray.push(combinedStat);
    }

    return statsArray;
  };
}

(async function main() {
  const generators = [makeGeneratorStats()];

  for (const lang of ["en"]) {
    const items = generators.flatMap((g) => g(lang));
    items.sort((a, b) => a.ref.localeCompare(b.ref));

    const jsonLines = Array.from(
      new Set(items.map((item) => JSON.stringify(item))),
    );

    const filePath = path.join(__dirname, "data", lang, "stats.ndjson");
    fs.writeFileSync(filePath, jsonLines.join("\n") + "\n");
  }
})();
