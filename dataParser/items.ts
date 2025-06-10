import * as fs from "node:fs";
import * as Tables from "./vendor/client/tables/index";
import { BaseType } from "./data/interfaces-apt.js";
import * as UNIQUE_FIXED_STATS from "./base/unique_mods.json";
import {
  API_ALL_ITEMS,
  API_BULK_ITEMS,
  API_ITEM_ICONS,
} from "./vendor/trade-api/index";
import * as assert from "node:assert";
import * as path from "node:path";

// const MAP_SCREENSHOTS = JSON.parse(
//     fs.readFileSync(path.join(__dirname, './maps.json'), { encoding: 'utf-8' })
//   ) as Array<[string, { img: string }]>;

const ITEM_OVERRIDES = new Map([
  // BaseItemTypes (Id)
  [
    "Metadata/Items/Armours/Boots/BootsAtlas1",
    {
      icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9Cb290cy9Ud29Ub25lZEJvb3RzIiwidyI6MiwiaCI6Miwic2NhbGUiOjF9XQ/93a61b5672/TwoTonedBoots.png",
      disc: { propEV: true, propES: true } as const,
    },
  ],
  [
    "Metadata/Items/Armours/Boots/BootsAtlas2",
    {
      icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9Cb290cy9Ud29Ub25lZEJvb3RzMkIiLCJ3IjoyLCJoIjoyLCJzY2FsZSI6MX1d/c046f556ab/TwoTonedBoots2B.png",
      disc: { propAR: true, propEV: true } as const,
    },
  ],
  [
    "Metadata/Items/Armours/Boots/BootsAtlas3",
    {
      icon: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQXJtb3Vycy9Cb290cy9Ud29Ub25lZEJvb3RzM0IiLCJ3IjoyLCJoIjoyLCJzY2FsZSI6MX1d/e3271c5de1/TwoTonedBoots3B.png",
      disc: { propAR: true, propES: true } as const,
    },
  ],
]);

const EXTRA_ITEMS: BaseType[] = [
  {
    name: "Blighted Map",
    refName: "Blighted Map",
    namespace: "ITEM",
    icon: "https://i.imgur.com/CRmwRkA.png",
  },
  {
    name: "Blight-ravaged Map",
    refName: "Blight-ravaged Map",
    namespace: "ITEM",
    icon: "https://i.imgur.com/FpyXU1v.png",
  },
];

const ITEM_CATEGORY = new Map([
  ["Helmet", { name: "Helmet", craftable: true }],
  ["Body Armour", { name: "Body Armour", craftable: true }],
  ["Gloves", { name: "Gloves", craftable: true }],
  ["Boots", { name: "Boots", craftable: true }],
  ["Shield", { name: "Shield", craftable: true }],
  ["Amulet", { name: "Amulet", craftable: true }],
  ["Belt", { name: "Belt", craftable: true }],
  ["Ring", { name: "Ring", craftable: true }],
  ["LifeFlask", { name: "Flask", craftable: true }],
  ["ManaFlask", { name: "Flask", craftable: true }],
  ["UtilityFlask", { name: "Flask", craftable: true }],
  //   ['AbyssJewel', { name: 'Abyss Jewel', craftable: true }],
  ["Jewel", { name: "Jewel", craftable: true }],
  //   ['Cluster Jewel', { name: 'Cluster Jewel', craftable: true }], // NOTE: manual
  ["Quiver", { name: "Quiver", craftable: true }],
  ["Claw", { name: "Claw", craftable: true }],
  ["Dagger", { name: "Dagger", craftable: true }],
  ["Bow", { name: "Bow", craftable: true }],
  ["Sceptre", { name: "Sceptre", craftable: true }],
  ["Wand", { name: "Wand", craftable: true }],
  ["FishingRod", { name: "Fishing Rod", craftable: true }],
  ["Staff", { name: "Staff", craftable: true }],
  ["Warstaff", { name: "Warstaff", craftable: true }],
  ["One Hand Axe", { name: "One-Handed Axe", craftable: true }],
  ["Two Hand Axe", { name: "Two-Handed Axe", craftable: true }],
  ["One Hand Mace", { name: "One-Handed Mace", craftable: true }],
  ["Two Hand Mace", { name: "Two-Handed Mace", craftable: true }],
  ["One Hand Sword", { name: "One-Handed Sword", craftable: true }],
  //   ['Thrusting One Hand Sword', { name: 'One-Handed Sword', craftable: true }],
  ["Two Hand Sword", { name: "Two-Handed Sword", craftable: true }],

  ["Relic", { name: "Sanctum Relic", craftable: true }],
  ["Tincture", { name: "Tincture", craftable: true }],
  ["AnimalCharm", { name: "Charm", craftable: true }],
  ["ExpeditionLogbook", { name: "Expedition Logbook", craftable: true }],
  [`Invitation`, { name: `Invitation`, craftable: true }], // NOTE: manual
  ["MemoryLine", { name: "Memory Line", craftable: true }],
  ["HeistBlueprint", { name: "Heist Blueprint", craftable: true }],
  ["HeistContract", { name: "Heist Contract", craftable: true }],
  ["HeistEquipmentTool", { name: "Heist Tool", craftable: true }],
  ["HeistEquipmentReward", { name: "Heist Brooch", craftable: true }],
  ["HeistEquipmentWeapon", { name: "Heist Gear", craftable: true }],
  ["HeistEquipmentUtility", { name: "Heist Cloak", craftable: true }],
  ["Trinket", { name: "Trinket", craftable: true }],
  [
    "UniqueFragment",
    { name: "Unique Fragment", craftable: true, uniqueOnly: true },
  ],

  ["NecropolisPack", {}],
  ["ItemisedCorpse", {}],
  ["ItemisedSanctum", {}],
  ["MiscMapItem", {}],
  ["Breachstone", {}],
  ["VaultKey", {}],
  ["StackableCurrency", {}],
  ["DelveStackableSocketableCurrency", {}],
  ["IncubatorStackable", {}],
  ["MapFragment", {}],
  ["MetamorphosisDNA", {}],

  ["Spear", { name: "Spear", craftable: true }],
  ["Flail", { name: "Flail", craftable: true }],
  ["Crossbow", { name: "Crossbow", craftable: true }],
  ["TrapTool", { name: "Trap Tool", craftable: true }],
  ["Focus", { name: "Focus", craftable: true }],
  ["Spear", { name: "Spear", craftable: true }],
  ["Flail", { name: "Flail", craftable: true }],
  ["Buckler", { name: "Buckler", craftable: true }],
]);
const ArmourTypes = Tables.ArmourTypes();
function getArmourField(baseRid: number): BaseType["armour"] {
  const found = ArmourTypes.find((row) => row.BaseItemTypesKey === baseRid);
  return found
    ? {
        ar: found.Armour > 0 ? [found.Armour, found.Armour] : undefined,
        ev: found.Evasion > 0 ? [found.Evasion, found.Evasion] : undefined,
        es:
          found.EnergyShield > 0
            ? [found.EnergyShield, found.EnergyShield]
            : undefined,
      }
    : undefined;
}

export function makeGenerator2Bases() {
  const ITEM_CLASS_BLACKLIST = new Set([
    "DelveSocketableCurrency",
    "Microtransaction",
    "HiddenItem",
    "QuestItem",
    "LabyrinthItem",
    "LabyrinthTrinket",
    "Leaguestone",
    "Currency",
    "Incubator",
    "SanctumSpecialRelic",
    "HideoutDoodad",
    "LabyrinthMapItem",
    "PantheonSoul",
    "IncursionItem",
    "HeistObjective",
    "AtlasUpgradeItem",
    "ArchnemesisMod",
    "SentinelDrone",
    "GiftBox",
    "InstanceLocalItem",
    "Gold",
    "Map", // ++
    "DivinationCard", // ++
    "Active Skill Gem", // ++
    "Support Skill Gem", // ++
    "Meta Skill Gem", // ++
    "SoulCore",
    "UncutSkillGem",
    "UncutSupportGem",
    "ConventionTreasure",
    "SkillGemToken",
    "PinnacleKey",
    "UltimatumKey",
    "UncutReservationGem",
    "TowerAugmentation",
    "Omen",
    "Focus",
  ]);

  const ItemClasses = Tables.ItemClasses();
  const Tags = Tables.Tags();

  const bulkItems = API_BULK_ITEMS()
    .filter(
      (s) =>
        s.id !== "Coffins" &&
        s.id !== "Cards" &&
        s.id !== "Sanctum" &&
        !s.id.startsWith("Maps")
    )
    .flatMap((s) =>
      s.entries.map((i) => ({
        ...i,
        image: i.image && `https://web.poecdn.com${i.image}`,
      }))
    );

  const baseIcons = API_ITEM_ICONS().filter((i) => !i.unique);

  const baseTypes = Tables.BaseItemTypes()
    .filter((row) => {
      const itemClass = ItemClasses[row.ItemClassesKey as unknown as number].Id;
      if (!ITEM_CATEGORY.has(itemClass)) {
        assert.ok(ITEM_CLASS_BLACKLIST.has(itemClass), itemClass);
        return false;
      }
      return !(
        row.Name !== "Albino Rhoa Feather" &&
        row.Name !== "Fishing Rod" &&
        row.Name !== "Two-Stone Ring" &&
        row.Name !== "Two-Toned Boots" &&
        (row.Name === "Imprinted Bestiary Orb" ||
          row.Name === "Uncarved Gemstone" ||
          (itemClass === "ItemisedSanctum" && row.TagsKeys.length < 2) ||
          row.SiteVisibility !== 1)
      );
    })
    .map((row) => ({
      ...row,
      armour: getArmourField(row._index),
      tradeTag: bulkItems.find((e) => e.text === row.Name)?.id,
      icon:
        bulkItems.find((e) => e.text === row.Name)?.image ??
        baseIcons.find((e) => e.baseType === row.Name)?.icon,
    }));

  return (lang: string) => {
    const BaseItemTypes = Tables.BaseItemTypes(lang);

    return baseTypes.map<BaseType>((row) => {
      let itemClass = ItemClasses[row.ItemClassesKey as unknown as number].Id;
      if (
        itemClass === "Jewel" &&
        row.TagsKeys.some((rid) =>
          Tags[rid as unknown as number].Id.startsWith("expansion_jewel_")
        )
      ) {
        itemClass = "Cluster Jewel";
      }
      if (
        itemClass === "MiscMapItem" &&
        row.TagsKeys.some(
          (rid) =>
            Tags[rid as unknown as number].Id === "maven_map" ||
            Tags[rid as unknown as number].Id === "primordial_map"
        )
      ) {
        itemClass = "Invitation";
      }

      const category = ITEM_CATEGORY.get(itemClass) ?? assert.fail();

      return {
        name: BaseItemTypes[row._index].Name,
        refName: row.Name,
        namespace: "ITEM",
        craftable: category.craftable
          ? {
              category: category.name,
              corrupted: row.IsCorrupted || undefined,
              uniqueOnly: category.uniqueOnly || undefined,
            }
          : undefined,
        tradeTag: row.tradeTag,
        armour: row.armour,
        icon: category.uniqueOnly ? "" : row.icon ?? "%NOT_FOUND%",
        w: row.Width > 1 ? row.Width : undefined,
        h: row.Height > 1 ? row.Height : undefined,
        ...(ITEM_OVERRIDES.get(row.Id) ?? ({} as object)),
      };
    });
  };
}

export function makeGenerator4Uniques() {
  const ndjsonBaseTypes = [
    // ...makeGenerator2Map()('en'),
    ...makeGenerator2Bases()("en"),
  ];

  const WORDLIST_UNIQUE = 6;
  const Words = Tables.Words();

  const UNIQUE_ICONS = API_ITEM_ICONS().filter((i) => i.unique);

  const tradeUniqueItems = API_ALL_ITEMS()
    .flatMap((s) => s.entries)
    .filter((i) => i.flags?.unique && (!i.disc || i.disc === "warfortheatlas"));

  const words = Tables.UniquesStashLayout()
    .filter(
      (row) =>
        row.ShowIfEmptyChallengeLeague &&
        row.RenamedVersion === null &&
        row.UniqueStashTypesKey !== 20 /* Watchstone */
    )
    .map((row) => Words[row.WordsKey]);
  // .filter(row =>
  //   row.Text2 !== "UNIQUE_NAME_NOT_ON_TRADE_YET" &&
  //   true)

  const extraUniqueItems = Words.filter(
    (row) =>
      row.Wordlist === WORDLIST_UNIQUE &&
      // Unique Pieces
      (row.Text2.startsWith("First Piece of ") ||
        row.Text2.startsWith("Second Piece of ") ||
        row.Text2.startsWith("Third Piece of ") ||
        row.Text2.startsWith("Fourth Piece of "))
  );
  words.push(...extraUniqueItems);

  return (lang: string) => {
    const Words = Tables.Words(lang);

    return words.flatMap((row) => {
      const baseTypes = tradeUniqueItems.filter((i) => i.name === row.Text2);
      assert.ok(baseTypes.length >= 1, row.Text2);

      if (baseTypes.length > 1) {
        if (
          row.Text2 !== "Grand Spectrum" &&
          row.Text2 !== "Combat Focus" &&
          row.Text2 !== "Precursor's Emblem" &&
          row.Text2 !== "Doryani's Delusion" &&
          row.Text2 !== "The Beachhead"
        ) {
          assert.ok(baseTypes.length === 1, row.Text2);
        }
      }

      return baseTypes.flatMap<BaseType>(({ type: baseTypeString }) => {
        const baseTypeDb = ndjsonBaseTypes.find(
          (entry) => entry.refName === baseTypeString
        );
        assert.ok(
          baseTypeDb,
          `Basetype "${baseTypeString}" of unique item "${row.Text2}" not found`
        );

        const template: BaseType = {
          name: Words[row._index].Text2,
          refName: row.Text2,
          namespace: "UNIQUE" as const,
          unique: {
            base: baseTypeString,
            fixedStats: UNIQUE_FIXED_STATS.find(
              (entry) =>
                entry.name === row.Text2 && entry.basetype === baseTypeString
            )?.fixedStats.map((_) => _.ref),
          },
          map:
            baseTypeDb.craftable?.category === "Map"
              ? {
                  screenshot:
                    "MAP_SCREENSHOTS.find(([name]) => name === row.Text2)?.[1].img",
                }
              : undefined,
          icon:
            UNIQUE_ICONS.find(
              (i) => i.unique === row.Text2 && i.baseType === baseTypeString
            )?.icon ?? "%NOT_FOUND%",
        };
        if (row.Text2 === "The Beachhead") {
          return [
            "HarbingerLow/Unique",
            "HarbingerMid/Unique",
            "HarbingerHigh/Unique",
          ].map<BaseType>((baseId) => ({
            ...template,
            ...(ITEM_OVERRIDES.get(baseId) ?? assert.fail()),
          }));
        }
        return [template];
      });
    });
  };
}

(async function main() {
  const generators = [
    // makeGenerator1Beasts(),
    // makeGenerator2Map(),
    // makeGenerator2Divcard(),
    // makeGenerator2Gems(),
    makeGenerator2Bases(),
    // makeGenerator4Uniques(),
    (_lang: string) => EXTRA_ITEMS,
  ];

  for (const lang of ["en"]) {
    const items = generators.flatMap((g) => g(lang));
    items.sort(
      (a, b) =>
        a.namespace.localeCompare(b.namespace) ||
        a.refName.localeCompare(b.refName)
    );

    const jsonLines = Array.from(
      new Set(items.map((item) => JSON.stringify(item)))
    );

    const filePath = path.join(__dirname, "data", lang, "items.ndjson");
    fs.writeFileSync(filePath, jsonLines.join("\n") + "\n");
  }
})();
