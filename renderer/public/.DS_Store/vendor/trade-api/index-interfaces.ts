
export interface StaticEntry {
    id: string;
    text: string;
    image?: string;
}

export interface StaticItems {
    id: string;
    label: string | null;
    entries: StaticEntry[];
}

export interface StatEntry {
    id: string;
    text: string;
    type: string;
}

export interface StatCategory {
    id: string;
    label: string;
    entries: StatEntry[];
}

export interface ItemEntry {
    type: string;
    text?: string;
    name?: string;
    flags?: {
        unique?: boolean;
    };
    disc?: string;
}

export interface ItemCategory {
    id: string;
    label: string;
    entries: ItemEntry[]
}

export interface FilterOption {
    id: string | null;
    text: string;
}

export interface Filter {
    id: string;
    text: string;
    minMax?: boolean;
    fullSpan?: boolean;
    option?: {
        options: FilterOption[];
    };
}

export interface FilterSection {
    id: string;
    title: string;
    hidden?: boolean;
    filters: Filter[];
}

export interface ItemIcon {
    baseType: string;
    icon: string;
    unique?: string;
}

export interface BulkItem{
    id: string;
    entries: StaticEntry[];
}