declare module './base/unique_mods.json.js' {
    interface FixedStat {
        ref: string;
        value: number;
    }
    interface UniqueFixedStat {
        name: string;
        basetype: string;
        fixedStats: FixedStat[];
    }
    export const UNIQUE_FIXED_STATS: UniqueFixedStat[]; // Replace `any` with a more specific type if possible
  }