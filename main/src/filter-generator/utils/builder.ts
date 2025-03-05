import { type IFilter } from "../data/IFilter";

const knownOperators = ["=", "!", "!=", "<=", ">=", "<", ">", "=="];

const beforeComment = "### Exiled-Exchange-2 custom filter rules - start ###";
const afterComment = "### Exiled-Exchange-2 custom filter rules -  end  ###";

export default function getFiltersContent(
  strategy: "before" | "after",
  oldContent: string,
  filters: IFilter[],
) {
  let start = oldContent.indexOf(beforeComment);
  let end = oldContent.indexOf(afterComment, start);
  let contentToReplace = oldContent;

  if (start === -1 || end === -1) {
    contentToReplace =
      strategy === "before"
        ? "\n\n" + contentToReplace
        : contentToReplace + "\n\n";
    start = strategy === "before" ? 0 : contentToReplace.length;
    end = strategy === "before" ? 0 : contentToReplace.length;
  } else {
    end += afterComment.length;
  }

  return (
    contentToReplace.slice(0, start) +
    [beforeComment, ...filters.map(mapSingleFilter), afterComment].join(
      "\n\n",
    ) +
    contentToReplace.slice(end)
  );
}

function mapSingleFilter(filter: IFilter) {
  const lines = [`${filter.hide ? "Hide" : "Show"} # ${filter.name}`];

  if (filter.identifiers) {
    Object.entries(filter.identifiers)
      .map(mapIdentifiersEntries)
      .forEach((line: string) => lines.push("\t" + line));
  }

  if (filter.modifiers) {
    Object.entries(filter.modifiers)
      .map(mapModifiersEntries)
      .forEach((line: string) => lines.push("\t" + line));
  }
  if (filter.continue) {
    lines.push("\tContinue");
  }

  return lines.join("\n");
}

function mapIdentifiersEntries([key, value]: [
  string,
  string | string[],
]): string {
  let safeValue = value;
  if (safeValue instanceof Array) {
    safeValue = safeValue.map((value) => `"${value}"`).join(" ");
  } else if (
    !knownOperators.some((ko) => (safeValue as string).startsWith(ko))
  ) {
    safeValue = `"${safeValue}"`;
  }
  return key + " " + safeValue;
}

function mapModifiersEntries([key, value]: [string, string | number]): string {
  return key + " " + String(value);
}
