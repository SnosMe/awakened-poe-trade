interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export const FONT_SIZE = {
  T0: 16, //ignorable entries
  T1: 24, //default
  T2: 36, //interesting stuff
  T3: 44, //important stuff
};

export const RARITY = {
  NORMAL: "Normal",
  MAGIC: "Magic",
  RARE: "Rare",
  UNIQUE: "Unique",
};

export const BASE_TYPES = {
  WAYSTONE: {
    T1: "Waystone (Tier 1)",
    T2: "Waystone (Tier 2)",
    T3: "Waystone (Tier 3)",
    T4: "Waystone (Tier 4)",
    T5: "Waystone (Tier 5)",
    T6: "Waystone (Tier 6)",
    T7: "Waystone (Tier 7)",
    T8: "Waystone (Tier 8)",
    T9: "Waystone (Tier 9)",
    T10: "Waystone (Tier 10)",
    T11: "Waystone (Tier 11)",
    T12: "Waystone (Tier 12)",
    T13: "Waystone (Tier 13)",
    T14: "Waystone (Tier 14)",
    T15: "Waystone (Tier 15)",
    T16: "Waystone (Tier 16)",
  },
};

const colors = {
  WHITE: { r: 255, g: 255, b: 255 },
  GREY: {
    r: 125,
    g: 125,
    b: 125,
  },
  GREY_LIGHT: { r: 192, g: 192, b: 192 },
  BLACK: { r: 0, g: 0, b: 0 },
  CYAN: {
    r: 0,
    g: 255,
    b: 255,
  },
  CYAN_GREENISH: { r: 0, g: 240, b: 190 },
  RED: {
    r: 255,
    g: 0,
    b: 0,
  },
  RED_DARK: { r: 100, g: 0, b: 0 },
  GREEN: {
    r: 0,
    g: 255,
    b: 0,
  },
  GREEN_BLUEISH: { r: 0, g: 255, b: 127 },
  BLUE: {
    r: 0,
    g: 75,
    b: 250,
  },
  BLUE_LIGHT: { r: 20, g: 110, b: 220 },
  BLUE_NAVY: { r: 0, g: 20, b: 40 },
  BLUE_DARK: { r: 0, g: 0, b: 100 },
  YELLOW: {
    r: 220,
    g: 220,
    b: 0,
  },
  YELLOW_LIGHT: { r: 240, g: 240, b: 0 },
  YELLOW_DARK: { r: 120, g: 120, b: 0 },
  ORANGE: {
    r: 240,
    g: 90,
    b: 35,
  },
  ORANGE_LIGHT: { r: 245, g: 190, b: 132 },
  ORANGE_DARK: { r: 76, g: 51, b: 12 },
  EXALT: { r: 249, g: 150, b: 25 },
  BROWN: {
    r: 100,
    g: 50,
    b: 30,
  },
  PINK: {
    r: 255,
    g: 0,
    b: 127,
  },
  PINK_LIGHT: { r: 255, b: 207, g: 255 },
  BEIGE: {
    r: 210,
    g: 178,
    b: 135,
  },
  BEIGE_PLAIN: { r: 180, g: 158, b: 135 },
  PURPLE: {
    r: 65,
    g: 20,
    b: 80,
  },
};

export const RGBA: Record<
  keyof typeof colors,
  (overides?: number | Partial<Color>) => string
> = Object.entries(colors).reduce((result, [key, value]) => {
  result[key as keyof typeof colors] = (
    overrides?: number | Partial<Color>
  ) => {
    overrides =
      typeof overrides === "number" ? { a: overrides } : overrides || {};
    const overridden = Object.assign({}, value, overrides);
    return `${overridden.r} ${overridden.g} ${overridden.b} ${
      overridden.a ?? 255
    }`;
  };
  return result;
}, {} as Record<keyof typeof colors, (overides?: number | Partial<Color>) => string>);
