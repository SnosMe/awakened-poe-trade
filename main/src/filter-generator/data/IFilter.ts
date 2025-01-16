export type IFilterIdentifiers = Record<string, string | Array<string>>;
export type IFilterModifiers = Record<string, string | number>;

export interface IFilter {
  name: string;
  identifiers?: IFilterIdentifiers;
  modifiers?: IFilterModifiers;
  hide?: boolean;
  continue?: boolean;
}

export interface IRawFilter {
  name: string;
  identifiers: Array<{ key: string; value: string }>;
  action: "interesting" | "exalt" | "hide";
}
