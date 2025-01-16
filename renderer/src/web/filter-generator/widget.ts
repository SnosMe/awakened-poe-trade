import type { Widget, Anchor } from "../overlay/widgets.js";

export interface FilterGeneratorWidget extends Widget {
  anchor: Anchor;
  selectedFilterFile: string;
  filtersFolder: string;
  filterStrategy: "before" | "after";
  entries: Array<{
    id: number;
    name: string;
    identifiers: Array<{
      key: string;
      value: string;
    }>;
    action: "interesting" | "exalt" | "hide";
  }>;
}
