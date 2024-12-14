import * as fs from 'node:fs';
import * as path from 'node:path';

interface ArmourTypeRow {
    BaseItemTypesKey: number;
    Armour: number;
    Evasion: number;
    EnergyShield: number;
}

export function ArmourTypes(): ArmourTypeRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'ArmourTypes.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as ArmourTypeRow[];
}


interface BaseItemTypeRow {
    _index: number;
    Id: string;
    Width: number;
    Height: number;
    Name: string;
    DropLevel: number;
    Implicit_ModsKeys: string[];
    ItemVisualIdentity: number;
    IsCorrupted: boolean;
    ItemClassesKey: string;
    SiteVisibility: number;
    TagsKeys: string[];
}

export function BaseItemTypes(lang: string = 'en'): BaseItemTypeRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'BaseItemTypes.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as BaseItemTypeRow[];
}

interface ItemClassRow {
    Id: string;
}

export function ItemClasses(): ItemClassRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'ItemClasses.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as ItemClassRow[];
}

interface ItemVisualIdentityRow {
    _index: number;
    Id: string;
    DDSFile: string;
    AOFile: string;
}

export function ItemVisualIdentity(): ItemVisualIdentityRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'ItemVisualIdentity.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as ItemVisualIdentityRow[];
}

interface TagRow {
    Id: string;
    DisplayString: string;
}

export function Tags(): TagRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'Tags.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as TagRow[];
}

interface UniqueStashLayoutRow {
    WordsKey: number;
    ShowIfEmptyChallengeLeague: boolean;
    RenamedVersion: number;
    UniqueStashTypesKey: number;
    ItemVisualIdentityKey: number;
    ShowIfEmptyStandard: boolean;
    IsAlternateArt: boolean;
}

export function UniquesStashLayout(): UniqueStashLayoutRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'UniquesStashLayout.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as UniqueStashLayoutRow[];
}

interface WordRow {
    _index: number;
    Wordlist: number;
    Text: string;
    SpawnWeight_Tags: number[];
    SpawnWeight_Values: number[];
    Text2: string;
}

export function Words(lang: string = 'en'): WordRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'Words.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as WordRow[];
}

interface StatsRow {
    Id: string;
    IsLocal: boolean;
    IsWeaponLocal: boolean;
    Semantics: number;
    Text: string;
    IsVirtual: boolean;
    HASH32: number;
    BelongsActiveSkillsKey: string[];
    IsScalable: boolean;
}

export function Stats(): StatsRow[] {
    const data = fs.readFileSync(path.join(__dirname, 'Stats.json'), { encoding: 'utf-8' });
    return JSON.parse(data) as StatsRow[];
}