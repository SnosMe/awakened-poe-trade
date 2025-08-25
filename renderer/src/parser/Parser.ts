import { Result, ok, err } from "neverthrow";
import {
  CLIENT_STRINGS as _$,
  CLIENT_STRINGS_REF as _$REF,
  ITEM_BY_REF,
  STAT_BY_MATCH_STR,
  BaseType,
  ITEM_BY_TRANSLATED,
} from "@/assets/data";
import { ModifierType, StatCalculated, sumStatsByModType } from "./modifiers";
import {
  linesToStatStrings,
  tryParseTranslation,
  getRollOrMinmaxAvg,
} from "./stat-translations";
import { ItemCategory } from "./meta";
import {
  IncursionRoom,
  ParsedItem,
  ItemInfluence,
  ItemRarity,
} from "./ParsedItem";
import { magicBasetype } from "./magic-name";
import {
  // isModInfoLine,
  // groupLinesByMod,
  // parseModInfoLine,
  parseModType,
  ModifierInfo,
  ParsedModifier,
  ENCHANT_LINE,
  SCOURGE_LINE,
  IMPLICIT_LINE,
  RUNE_LINE,
  isModInfoLine,
  groupLinesByMod,
  parseModInfoLine,
  ADDED_RUNE_LINE,
} from "./advanced-mod-desc";
import { calcPropPercentile, QUALITY_STATS } from "./calc-q20";

type SectionParseResult =
  | "SECTION_PARSED"
  | "SECTION_SKIPPED"
  | "PARSER_SKIPPED";

type ParserFn = (section: string[], item: ParserState) => SectionParseResult;
type VirtualParserFn = (item: ParserState) => Result<never, string> | void;

interface ParserState extends ParsedItem {
  name: string;
  baseType: string | undefined;
  infoVariants: BaseType[];
}

const parsers: Array<ParserFn | { virtual: VirtualParserFn }> = [
  parseUnidentified,
  { virtual: parseSuperior },
  parseSynthesised,
  parseCategoryByHelpText,
  { virtual: normalizeName },
  parseVaalGemName,
  { virtual: findInDatabase },
  // -----------
  parseItemLevel,
  parseRequirements,
  parseTalismanTier,
  parseGem,
  parseArmour,
  parseWeapon,
  parseCaster,
  parseFlask,
  parseJewelery,
  parseCharmSlots,
  parseSpirit,
  parsePriceNote,
  parseUnneededText,
  parseTimelostRadius,
  parseStackSize,
  parseCorrupted,
  parseFoil,
  parseInfluence,
  parseMap,
  parseWaystone,
  parseSockets,
  parseRuneSockets,
  parseHeistBlueprint,
  parseAreaLevel,
  parseAtzoatlRooms,
  parseMirroredTablet,
  parseFilledCoffin,
  parseMirrored,
  parseSentinelCharge,
  parseLogbookArea,
  parseLogbookArea,
  parseLogbookArea,
  parseModifiers, // enchant
  parseModifiers, // rune
  parseModifiers, // implicit
  parseModifiers, // explicit
  // catch enchant and rune since they don't have curlys rn
  parseModifiersPoe2, // enchant
  parseModifiersPoe2, // rune
  // HACK: catch implicit and explicit for controllers
  parseModifiersPoe2, // implicit
  parseModifiersPoe2, // explicit
  { virtual: transformToLegacyModifiers },
  { virtual: parseFractured },
  { virtual: parseBlightedMap },
  { virtual: applyRuneSockets },
  { virtual: applyElementalAdded },
  { virtual: pickCorrectVariant },
  { virtual: calcBasePercentile },
];

export function parseClipboard(clipboard: string): Result<ParsedItem, string> {
  try {
    const chatRegex = /\[.*?\]|\[.*?\|.*?\]/;
    const isFromChat = chatRegex.test(clipboard);
    if (isFromChat) {
      clipboard = parseAffixStrings(clipboard);
    }
    let sections = itemTextToSections(clipboard);

    if (sections[0][2] === _$.CANNOT_USE_ITEM) {
      sections[0].pop(); // remove CANNOT_USE_ITEM line
      sections[1].unshift(...sections[0]); // prepend item class & rarity into second section
      sections.shift(); // remove first section where CANNOT_USE_ITEM line was
    }
    const parsed = parseNamePlate(sections[0]);
    if (!parsed.isOk()) return parsed;

    sections.shift();
    parsed.value.rawText = clipboard;

    // each section can be parsed at most by one parser
    for (const parser of parsers) {
      if (typeof parser === "object") {
        const error = parser.virtual(parsed.value);
        if (error) return error;
        continue;
      }
      for (const section of sections) {
        const result = parser(section, parsed.value);
        if (result === "SECTION_PARSED") {
          sections = sections.filter((s) => s !== section);
          break;
        } else if (result === "PARSER_SKIPPED") {
          break;
        }
      }
    }
    if (parsed.isOk() && isFromChat) {
      parsed.value.fromChat = isFromChat;
    }
    return Object.freeze(parsed);
  } catch (e) {
    console.log(e);
    return err("item.parse_error");
  }
}

function itemTextToSections(text: string) {
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  const sections: string[][] = [[]];
  lines.reduce((section, line) => {
    if (line !== "--------") {
      section.push(line);
      return section;
    } else {
      const section: string[] = [];
      sections.push(section);
      return section;
    }
  }, sections[0]);
  return sections.filter((section) => section.length);
}

function normalizeName(item: ParserState) {
  if (item.rarity === ItemRarity.Magic) {
    const baseType = magicBasetype(item.name);
    if (baseType) {
      item.name = baseType;
    }
  }

  if (item.rarity === ItemRarity.Normal || item.rarity === ItemRarity.Rare) {
    if (item.baseType) {
      if (_$.MAP_BLIGHTED.test(item.baseType)) {
        item.baseType = _$REF.MAP_BLIGHTED.exec(item.baseType)![1];
      } else if (_$.MAP_BLIGHT_RAVAGED.test(item.baseType)) {
        item.baseType = _$REF.MAP_BLIGHT_RAVAGED.exec(item.baseType)![1];
      }
    } else {
      if (_$.MAP_BLIGHTED.test(item.name)) {
        item.name = _$REF.MAP_BLIGHTED.exec(item.name)![1];
      } else if (_$.MAP_BLIGHT_RAVAGED.test(item.name)) {
        item.name = _$REF.MAP_BLIGHT_RAVAGED.exec(item.name)![1];
      }
    }
  }

  if (item.category === ItemCategory.MetamorphSample) {
    if (_$.METAMORPH_BRAIN.test(item.name)) {
      item.name = "Metamorph Brain";
    } else if (_$.METAMORPH_EYE.test(item.name)) {
      item.name = "Metamorph Eye";
    } else if (_$.METAMORPH_LUNG.test(item.name)) {
      item.name = "Metamorph Lung";
    } else if (_$.METAMORPH_HEART.test(item.name)) {
      item.name = "Metamorph Heart";
    } else if (_$.METAMORPH_LIVER.test(item.name)) {
      item.name = "Metamorph Liver";
    }
  }
}

function findInDatabase(item: ParserState) {
  let info: BaseType[] | undefined;
  if (item.category === ItemCategory.DivinationCard) {
    info = ITEM_BY_REF("DIVINATION_CARD", item.name);
  } else if (item.category === ItemCategory.CapturedBeast) {
    info = ITEM_BY_REF("CAPTURED_BEAST", item.baseType ?? item.name);
  } else if (item.category === ItemCategory.Gem) {
    info = ITEM_BY_REF("GEM", item.name);
  } else if (item.category === ItemCategory.MetamorphSample) {
    info = ITEM_BY_REF("ITEM", item.name);
  } else if (item.category === ItemCategory.Voidstone) {
    info = ITEM_BY_REF("ITEM", "Charged Compass");
  } else if (item.rarity === ItemRarity.Unique && !item.isUnidentified) {
    info = ITEM_BY_REF("UNIQUE", item.name);
  } else {
    info = ITEM_BY_REF("ITEM", item.baseType ?? item.name);
  }
  if (!info?.length) {
    // HACK: controller support while poe2 doesn't have advanced copy for controllers
    if (item.category === ItemCategory.DivinationCard) {
      info = ITEM_BY_TRANSLATED("DIVINATION_CARD", item.name);
    } else if (item.category === ItemCategory.CapturedBeast) {
      info = ITEM_BY_TRANSLATED("CAPTURED_BEAST", item.baseType ?? item.name);
    } else if (item.category === ItemCategory.Gem) {
      info = ITEM_BY_TRANSLATED("GEM", item.name);
    } else if (item.category === ItemCategory.MetamorphSample) {
      info = ITEM_BY_TRANSLATED("ITEM", item.name);
    } else if (item.category === ItemCategory.Voidstone) {
      info = ITEM_BY_TRANSLATED("ITEM", "Charged Compass");
    } else if (item.rarity === ItemRarity.Unique && !item.isUnidentified) {
      info = ITEM_BY_TRANSLATED("UNIQUE", item.name);
    } else {
      info = ITEM_BY_TRANSLATED("ITEM", item.baseType ?? item.name);
    }
    if (!info?.length) {
      return err("item.unknown");
    }
  }
  if (info[0].unique) {
    const uniqueInfo = info.filter(
      (info) => info.unique!.base === item.baseType,
    );
    if (uniqueInfo?.length) {
      info = uniqueInfo;
    } else if (item.baseType) {
      const baseInfo = ITEM_BY_TRANSLATED("ITEM", item.baseType);
      if (baseInfo?.length) {
        info = info.filter((info) => info.unique!.base === baseInfo[0].refName);
      }
    }
  }
  item.infoVariants = info;
  // choose 1st variant, correct one will be picked at the end of parsing
  item.info = info[0];
  // same for every variant
  if (!item.category) {
    if (item.info.craftable) {
      item.category = item.info.craftable.category;
    } else if (item.info.unique) {
      item.category = ITEM_BY_REF(
        "ITEM",
        item.info.unique.base,
      )![0].craftable!.category;
    }
  }

  // Override charm since its flask in trade
  if (item.category === ItemCategory.Charm) {
    item.category = ItemCategory.Flask;
  }
}

function parseMap(section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.MAP_TIER)) {
    item.mapTier = Number(section[0].slice(_$.MAP_TIER.length));
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseWaystone(section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.WAYSTONE_TIER)) {
    item.mapTier = Number(section[0].slice(_$.WAYSTONE_TIER.length));
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseBlightedMap(item: ParsedItem) {
  if (item.category !== ItemCategory.Map) return;

  const calc = item.statsByType.find(
    (calc) =>
      calc.type === ModifierType.Implicit &&
      calc.stat.ref.startsWith("Area is infested with Fungal Growths"),
  );
  if (calc !== undefined) {
    if (calc.sources[0].contributes!.value === 9) {
      item.mapBlighted = "Blight-ravaged";
      item.info.icon = ITEM_BY_REF("ITEM", "Blight-ravaged Map")![0].icon;
    } else {
      item.mapBlighted = "Blighted";
      item.info.icon = ITEM_BY_REF("ITEM", "Blighted Map")![0].icon;
    }
  }
}

function parseFractured(item: ParserState) {
  if (item.newMods.some((mod) => mod.info.type === ModifierType.Fractured)) {
    item.isFractured = true;
  }
}

function pickCorrectVariant(item: ParserState) {
  if (!item.info.disc) return;

  for (const variant of item.infoVariants) {
    const cond = variant.disc!;

    if (cond.propAR && !item.armourAR) continue;
    if (cond.propEV && !item.armourEV) continue;
    if (cond.propES && !item.armourES) continue;

    if (cond.mapTier === "W" && !(item.mapTier! <= 5)) continue;
    if (cond.mapTier === "Y" && !(item.mapTier! >= 6 && item.mapTier! <= 10))
      continue;
    if (cond.mapTier === "R" && !(item.mapTier! >= 11)) continue;

    if (
      cond.hasImplicit &&
      !item.statsByType.some(
        (calc) =>
          calc.type === ModifierType.Implicit &&
          calc.stat.ref === cond.hasImplicit!.ref,
      )
    )
      continue;

    if (
      cond.hasExplicit &&
      !item.statsByType.some(
        (calc) =>
          calc.type === ModifierType.Explicit &&
          calc.stat.ref === cond.hasExplicit!.ref,
      )
    )
      continue;

    if (cond.sectionText && !item.rawText.includes(cond.sectionText)) continue;

    item.info = variant;
  }

  // it may happen that we don't find correct variant
  // i.e. corrupted implicit on Two-Stone Ring
}

function parseNamePlate(section: string[]) {
  let line = section.shift();
  let uncutSkillGem = false;
  if (!line?.startsWith(_$.ITEM_CLASS)) {
    // HACK: Uncut skill gems
    if (line && section.unshift(line) && isUncutSkillGem(section)) {
      uncutSkillGem = true;
    } else {
      return err("item.parse_error");
    }
  }

  line = section.shift();
  let rarityText: string | undefined;
  if (line?.startsWith(_$.RARITY)) {
    rarityText = line.slice(_$.RARITY.length);
    line = section.shift();
  }

  let name: string;
  if (line != null) {
    name = markupConditionParser(line);
  } else {
    return err("item.parse_error");
  }

  line = section.shift();
  const baseType = line && markupConditionParser(line);

  const item: ParserState = {
    rarity: undefined,
    category: undefined,
    name,
    baseType,
    isUnidentified: false,
    isCorrupted: false,
    newMods: [],
    statsByType: [],
    unknownModifiers: [],
    influences: [],
    info: undefined!,
    infoVariants: undefined!,
    rawText: undefined!,
  };

  switch (rarityText) {
    case _$.RARITY_CURRENCY:
      item.category = ItemCategory.Currency;
      break;
    case _$.RARITY_DIVCARD:
      item.category = ItemCategory.DivinationCard;
      break;
    case _$.RARITY_GEM:
      item.category = ItemCategory.Gem;
      break;
    case _$.RARITY_NORMAL:
    case _$.RARITY_QUEST:
      item.rarity = ItemRarity.Normal;
      break;
    case _$.RARITY_MAGIC:
      item.rarity = ItemRarity.Magic;
      break;
    case _$.RARITY_RARE:
      item.rarity = ItemRarity.Rare;
      break;
    case _$.RARITY_UNIQUE:
      item.rarity = ItemRarity.Unique;
      break;
  }
  if (uncutSkillGem) {
    item.category = ItemCategory.UncutGem;
  }

  return ok(item);
}

function parseInfluence(section: string[], item: ParsedItem) {
  if (section.length <= 2) {
    const countBefore = item.influences.length;

    for (const line of section) {
      switch (line) {
        case _$.INFLUENCE_CRUSADER:
          item.influences.push(ItemInfluence.Crusader);
          break;
        case _$.INFLUENCE_ELDER:
          item.influences.push(ItemInfluence.Elder);
          break;
        case _$.INFLUENCE_SHAPER:
          item.influences.push(ItemInfluence.Shaper);
          break;
        case _$.INFLUENCE_HUNTER:
          item.influences.push(ItemInfluence.Hunter);
          break;
        case _$.INFLUENCE_REDEEMER:
          item.influences.push(ItemInfluence.Redeemer);
          break;
        case _$.INFLUENCE_WARLORD:
          item.influences.push(ItemInfluence.Warlord);
          break;
      }
    }

    if (countBefore < item.influences.length) {
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

// #region Small Sections
function parseCorrupted(section: string[], item: ParsedItem) {
  if (section[0].trim() === _$.CORRUPTED) {
    item.isCorrupted = true;
    return "SECTION_PARSED";
  } else if (section[0] === _$.UNMODIFIABLE) {
    item.isCorrupted = true;
    item.isUnmodifiable = true;
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseFoil(section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Unique) {
    return "PARSER_SKIPPED";
  }
  if (section[0] === _$.FOIL_UNIQUE) {
    item.isFoil = true;
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseUnidentified(section: string[], item: ParsedItem) {
  if (section[0] === _$.UNIDENTIFIED) {
    item.isUnidentified = true;
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseItemLevel(section: string[], item: ParsedItem) {
  let prefix = _$.ITEM_LEVEL;
  if (item.info.refName === "Filled Coffin") {
    prefix = _$.CORPSE_LEVEL;
  }

  for (const line of section) {
    if (line.startsWith(prefix)) {
      item.itemLevel = Number(line.slice(prefix.length));
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

function parseRequirements(section: string[], item: ParsedItem) {
  if (
    section[0].startsWith(_$.REQUIREMENTS) ||
    section[0].startsWith(_$.REQUIRES)
  ) {
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseTalismanTier(section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.TALISMAN_TIER)) {
    item.talismanTier = Number(section[0].slice(_$.TALISMAN_TIER.length));
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseVaalGemName(section: string[], item: ParserState) {
  if (item.category !== ItemCategory.Gem) return "PARSER_SKIPPED";

  // TODO blocked by https://www.pathofexile.com/forum/view-thread/3231236
  if (section.length === 1) {
    let gemName: string | undefined;
    if (ITEM_BY_REF("GEM", section[0])) {
      gemName = section[0];
    }
    if (gemName) {
      item.name = ITEM_BY_REF("GEM", gemName)![0].refName;
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

function parseGem(section: string[], item: ParsedItem) {
  if (
    item.category !== ItemCategory.Gem &&
    item.category !== ItemCategory.UncutGem
  ) {
    return "PARSER_SKIPPED";
  }

  const gemLevelLineNumber = item.category === ItemCategory.Gem ? 1 : 0;

  if (section[gemLevelLineNumber]?.startsWith(_$.GEM_LEVEL)) {
    // "Level: 20 (Max)"
    item.gemLevel = parseInt(
      section[gemLevelLineNumber].slice(_$.GEM_LEVEL.length),
      10,
    );

    parseQualityNested(section, item);

    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}
// #endregion

function parseStackSize(section: string[], item: ParsedItem) {
  if (
    item.rarity !== ItemRarity.Normal &&
    item.category !== ItemCategory.Currency &&
    item.category !== ItemCategory.DivinationCard
  ) {
    return "PARSER_SKIPPED";
  }
  if (section[0].startsWith(_$.STACK_SIZE)) {
    // Portal Scroll "Stack Size: 2[localized separator]448/40"
    const [value, max] = section[0]
      .slice(_$.STACK_SIZE.length)
      .replace(/[^\d/]/g, "")
      .split("/")
      .map(Number);
    item.stackSize = { value, max };

    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseRuneSockets(section: string[], item: ParsedItem) {
  const categoryMax = getMaxSockets(item.category);
  const armourOrWeapon = categoryMax && isArmourOrWeaponOrCaster(item.category);
  if (!armourOrWeapon) return "PARSER_SKIPPED";
  if (section[0].startsWith(_$.SOCKETS)) {
    const sockets = section[0].slice(_$.SOCKETS.length).trimEnd();
    const current = sockets.split("S").length - 1;
    if (item.isCorrupted) {
      item.runeSockets = {
        empty: 0,
        current,
        normal: categoryMax,
      };
    } else {
      item.runeSockets = {
        empty: 0,
        current,
        normal: categoryMax,
      };
    }

    return "SECTION_PARSED";
  }
  if (categoryMax && !item.isCorrupted) {
    item.runeSockets = {
      empty: categoryMax,
      current: 0,
      normal: categoryMax,
    };
  }
  return "SECTION_SKIPPED";
}

function parseSockets(section: string[], item: ParsedItem) {
  if (item.category === ItemCategory.Gem && section[0].startsWith(_$.SOCKETS)) {
    let sockets = section[0].slice(_$.SOCKETS.length).trimEnd();
    sockets = sockets.replace(/[^ -]/g, "#");

    item.gemSockets = {
      number: sockets.split("#").length - 1,
      white: sockets.split("W").length - 1,
      linked: undefined,
    };

    if (sockets === "#-#-#-#-#-#") {
      item.gemSockets.linked = 6;
    } else if (
      sockets === "# #-#-#-#-#" ||
      sockets === "#-#-#-#-# #" ||
      sockets === "#-#-#-#-#"
    ) {
      item.gemSockets.linked = 5;
    }
    return "SECTION_PARSED";
  }
  return "SECTION_SKIPPED";
}

function parseQualityNested(section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.QUALITY)) {
      // "Quality: +20% (augmented)"
      item.quality = parseInt(line.slice(_$.QUALITY.length), 10);
      break;
    }
  }
}

function parseArmour(section: string[], item: ParsedItem) {
  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (line.startsWith(_$.ARMOUR)) {
      item.armourAR = parseInt(line.slice(_$.ARMOUR.length), 10);
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.EVASION)) {
      item.armourEV = parseInt(line.slice(_$.EVASION.length), 10);
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.ENERGY_SHIELD)) {
      item.armourES = parseInt(line.slice(_$.ENERGY_SHIELD.length), 10);
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.BLOCK_CHANCE)) {
      item.armourBLOCK = parseInt(line.slice(_$.BLOCK_CHANCE.length), 10);
      isParsed = "SECTION_PARSED";
      continue;
    }
  }

  if (isParsed === "SECTION_PARSED") {
    parseQualityNested(section, item);
  }
  if (item.rarity === "Unique") {
    // undo everything
    item.armourAR = undefined;
    item.armourEV = undefined;
    item.armourES = undefined;
    item.armourBLOCK = undefined;
  }

  return isParsed;
}

function parseWeapon(section: string[], item: ParsedItem) {
  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (line.startsWith(_$.CRIT_CHANCE)) {
      item.weaponCRIT = parseFloat(line.slice(_$.CRIT_CHANCE.length));
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.ATTACK_SPEED)) {
      item.weaponAS = parseFloat(line.slice(_$.ATTACK_SPEED.length));
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.PHYSICAL_DAMAGE)) {
      item.weaponPHYSICAL = getRollOrMinmaxAvg(
        line
          .slice(_$.PHYSICAL_DAMAGE.length)
          .split("-")
          .map((str) => parseInt(str, 10)),
      );
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.ELEMENTAL_DAMAGE)) {
      item.weaponELEMENTAL = line
        .slice(_$.ELEMENTAL_DAMAGE.length)
        .split(", ")
        .map((element) =>
          getRollOrMinmaxAvg(
            element.split("-").map((str) => parseInt(str, 10)),
          ),
        )
        .reduce((sum, x) => sum + x, 0);

      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.FIRE_DAMAGE)) {
      const fireDamage = line
        .slice(_$.FIRE_DAMAGE.length)
        .split(", ")
        .map((element) =>
          getRollOrMinmaxAvg(
            element.split("-").map((str) => parseInt(str, 10)),
          ),
        )
        .reduce((sum, x) => sum + x, 0);
      if (item.weaponELEMENTAL) {
        item.weaponELEMENTAL = fireDamage + item.weaponELEMENTAL;
      } else {
        item.weaponELEMENTAL = fireDamage;
      }
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.COLD_DAMAGE)) {
      const coldDamage = line
        .slice(_$.COLD_DAMAGE.length)
        .split(", ")
        .map((element) =>
          getRollOrMinmaxAvg(
            element.split("-").map((str) => parseInt(str, 10)),
          ),
        )
        .reduce((sum, x) => sum + x, 0);
      if (item.weaponELEMENTAL) {
        item.weaponELEMENTAL = coldDamage + item.weaponELEMENTAL;
      } else {
        item.weaponELEMENTAL = coldDamage;
      }
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.LIGHTNING_DAMAGE)) {
      const lightningDamage = line
        .slice(_$.LIGHTNING_DAMAGE.length)
        .split(", ")
        .map((element) =>
          getRollOrMinmaxAvg(
            element.split("-").map((str) => parseInt(str, 10)),
          ),
        )
        .reduce((sum, x) => sum + x, 0);
      if (item.weaponELEMENTAL) {
        item.weaponELEMENTAL = lightningDamage + item.weaponELEMENTAL;
      } else {
        item.weaponELEMENTAL = lightningDamage;
      }
      isParsed = "SECTION_PARSED";
      continue;
    }
    if (line.startsWith(_$.RELOAD_SPEED)) {
      item.weaponReload = parseFloat(line.slice(_$.RELOAD_SPEED.length));
      isParsed = "SECTION_PARSED";
      continue;
    }
  }

  if (isParsed === "SECTION_PARSED") {
    parseQualityNested(section, item);
  }

  if (item.rarity === "Unique") {
    // undo everything
    item.weaponELEMENTAL = undefined;
    item.weaponAS = undefined;
    item.weaponPHYSICAL = undefined;
    item.weaponCOLD = undefined;
    item.weaponLIGHTNING = undefined;
    item.weaponFIRE = undefined;
    item.weaponCRIT = undefined;
    item.weaponReload = undefined;
  }

  return isParsed;
}

function parseCaster(section: string[], item: ParsedItem) {
  if (
    item.category !== ItemCategory.Wand &&
    item.category !== ItemCategory.Sceptre &&
    item.category !== ItemCategory.Staff
  )
    return "PARSER_SKIPPED";

  if (section.length === 1 && section[0].startsWith(_$.QUALITY)) {
    parseQualityNested(section, item);
    return "SECTION_PARSED";
  }

  return "SECTION_SKIPPED";
}

function parseLogbookArea(section: string[], item: ParsedItem) {
  if (item.info.refName !== "Expedition Logbook") return "PARSER_SKIPPED";
  if (section.length < 3) return "SECTION_SKIPPED";

  // skip Area, parse Faction
  const faction = STAT_BY_MATCH_STR(section[1]);
  if (!faction) return "SECTION_SKIPPED";

  const areaMods: ParsedModifier[] = [
    {
      info: { tags: [], type: ModifierType.Pseudo },
      stats: [
        {
          stat: faction.stat,
          translation: faction.matcher,
        },
      ],
    },
  ];

  const { modType, lines } = parseModType(section.slice(2));
  for (const line of lines) {
    const found = tryParseTranslation(
      { string: line, unscalable: false },
      modType,
    );
    if (found) {
      areaMods.push({
        info: { tags: [], type: modType },
        stats: [found],
      });
    }
  }

  areaMods.shift();
  if (areaMods.length) {
    if (!item.logbookAreaMods) {
      item.logbookAreaMods = [areaMods];
    } else {
      item.logbookAreaMods.push(areaMods);
    }
  }

  return "SECTION_PARSED";
}

export function parseModifiersPoe2(section: string[], item: ParsedItem) {
  if (
    item.rarity !== ItemRarity.Normal &&
    item.rarity !== ItemRarity.Magic &&
    item.rarity !== ItemRarity.Rare &&
    item.rarity !== ItemRarity.Unique
  ) {
    return "PARSER_SKIPPED";
  }

  let foundAnyMods = false;

  const enchantOrScourgeOrRune = section.find(
    (line) =>
      line.endsWith(ENCHANT_LINE) ||
      line.endsWith(SCOURGE_LINE) ||
      line.endsWith(RUNE_LINE) ||
      line.endsWith(ADDED_RUNE_LINE),
  );

  if (enchantOrScourgeOrRune) {
    const { lines } = parseModType(section);
    const modInfo: ModifierInfo = {
      type: enchantOrScourgeOrRune.endsWith(ENCHANT_LINE)
        ? ModifierType.Enchant
        : enchantOrScourgeOrRune.endsWith(SCOURGE_LINE)
          ? ModifierType.Scourge
          : enchantOrScourgeOrRune.endsWith(ADDED_RUNE_LINE)
            ? ModifierType.AddedRune
            : ModifierType.Rune,
      tags: [],
    };
    foundAnyMods = parseStatsFromMod(lines, item, { info: modInfo, stats: [] });
  } else {
    for (const statLines of section) {
      let { modType, lines } = parseModType([statLines]);
      if (
        modType === ModifierType.Explicit &&
        item.category === ItemCategory.Relic
      ) {
        modType = ModifierType.Sanctum;
      }
      // const modInfo = parseModInfoLine(modLine, modType);
      const found = parseStatsFromMod(lines, item, {
        info: { type: modType, tags: [] },
        stats: [],
      });
      foundAnyMods = found || foundAnyMods;

      if (modType === ModifierType.Veiled) {
        item.isVeiled = true;
      }
    }
  }

  return foundAnyMods ? "SECTION_PARSED" : "SECTION_SKIPPED";
}

function parseModifiers(section: string[], item: ParsedItem) {
  if (
    item.rarity !== ItemRarity.Normal &&
    item.rarity !== ItemRarity.Magic &&
    item.rarity !== ItemRarity.Rare &&
    item.rarity !== ItemRarity.Unique
  ) {
    return "PARSER_SKIPPED";
  }

  const recognizedLine = section.find(
    (line) =>
      line.endsWith(ENCHANT_LINE) ||
      line.endsWith(SCOURGE_LINE) ||
      line.endsWith(RUNE_LINE) ||
      isModInfoLine(line),
  );

  if (!recognizedLine) {
    return "SECTION_SKIPPED";
  }

  if (isModInfoLine(recognizedLine)) {
    for (const { modLine, statLines } of groupLinesByMod(section)) {
      const { modType, lines } = parseModType(statLines);
      const modInfo = parseModInfoLine(modLine, modType);
      if (
        item.category === ItemCategory.Relic &&
        modInfo.type === ModifierType.Explicit
      ) {
        modInfo.type = ModifierType.Sanctum;
      }
      parseStatsFromMod(lines, item, { info: modInfo, stats: [] });

      if (modType === ModifierType.Veiled) {
        item.isVeiled = true;
      }
    }
  } else {
    const { lines } = parseModType(section);
    const modInfo: ModifierInfo = {
      type: recognizedLine.endsWith(ENCHANT_LINE)
        ? ModifierType.Enchant
        : recognizedLine.endsWith(SCOURGE_LINE)
          ? ModifierType.Scourge
          : ModifierType.Rune,
      tags: [],
    };
    parseStatsFromMod(lines, item, { info: modInfo, stats: [] });
  }

  return "SECTION_PARSED";
}

function applyRuneSockets(item: ParsedItem) {
  // If we have any rune sockets
  if (item.runeSockets) {
    // Count current mods that are of type Rune

    const runeMods = item.newMods.filter(
      (mod) => mod.info.type === ModifierType.Rune,
    );
    const runeStats = item.statsByType.filter(
      (calc) => calc.type === ModifierType.Rune,
    );
    const runes = runeMods
      .map((mod) => {
        const stat = runeStats.find(
          (stat) => stat.sources[0].stat === mod.stats[0],
        );
        if (!stat) return [];
        return runeCount(mod, stat);
      })
      .flat();

    // HACK: fix since I can't detect how many exist due to rune tiers
    const tempFix = runes.reduce((x, y) => x + y, 0) > 0;
    const potentialEmptySockets = tempFix
      ? 0
      : Math.max(item.runeSockets.normal, item.runeSockets.current);
    item.runeSockets.empty = potentialEmptySockets;
  }
}

function parseMirrored(section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$.MIRRORED) {
      item.isMirrored = true;
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

function parseFlask(section: string[], item: ParsedItem) {
  // the purpose of this parser is to "consume" flask buffs
  // so they are not recognized as modifiers

  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (_$.FLASK_CHARGES.test(line)) {
      isParsed = "SECTION_PARSED";
      break;
    }
  }

  if (isParsed) {
    parseQualityNested(section, item);
  }

  return isParsed;
}

function parseJewelery(section: string[], item: ParsedItem) {
  if (
    item.category !== ItemCategory.Amulet &&
    item.category !== ItemCategory.Ring &&
    item.category !== ItemCategory.Belt
  ) {
    return "PARSER_SKIPPED";
  }

  for (const line of section) {
    if (line.startsWith(_$.QUALITY.substring(0, _$.QUALITY.indexOf(":")))) {
      return "SECTION_PARSED";
    }
  }

  return "SECTION_SKIPPED";
}

function parseCharmSlots(section: string[], item: ParsedItem) {
  // the purpose of this parser is to "consume" charm slot 1 sections
  // so they are not recognized as modifiers
  if (item.category !== ItemCategory.Belt) return "PARSER_SKIPPED";

  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (line.startsWith(_$.CHARM_SLOTS)) {
      isParsed = "SECTION_PARSED";
      break;
    }
  }

  return isParsed;
}

function parseSpirit(section: string[], item: ParsedItem) {
  // the purpose of this parser is to "consume" Spirit: 100 sections
  // so they are not recognized as modifiers
  if (item.category !== ItemCategory.Sceptre) return "PARSER_SKIPPED";

  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (line.startsWith(_$.BASE_SPIRIT)) {
      isParsed = "SECTION_PARSED";
      break;
    }
  }

  return isParsed;
}

function parsePriceNote(section: string[], item: ParsedItem) {
  let isParsed: SectionParseResult = "SECTION_SKIPPED";

  for (const line of section) {
    if (line.startsWith(_$.PRICE_NOTE)) {
      isParsed = "SECTION_PARSED";
      break;
    }
  }

  return isParsed;
}

function parseUnneededText(section: string[], item: ParsedItem) {
  if (
    item.category !== ItemCategory.Quiver &&
    item.category !== ItemCategory.Flask &&
    item.category !== ItemCategory.Charm &&
    item.category !== ItemCategory.Waystone &&
    item.category !== ItemCategory.Map &&
    item.category !== ItemCategory.Jewel &&
    item.category !== ItemCategory.Relic &&
    item.category !== ItemCategory.Tablet &&
    item.category !== ItemCategory.TowerAugment &&
    item.info.refName !== "Expedition Logbook" &&
    item.category !== ItemCategory.Sceptre &&
    item.category !== ItemCategory.Wand &&
    item.category !== ItemCategory.Staff &&
    item.category !== ItemCategory.Shield &&
    item.category !== ItemCategory.Spear &&
    item.category !== ItemCategory.Buckler
  )
    return "PARSER_SKIPPED";

  for (const line of section) {
    if (
      line.startsWith(_$.QUIVER_HELP_TEXT) ||
      line.startsWith(_$.FLASK_HELP_TEXT) ||
      line.startsWith(_$.CHARM_HELP_TEXT) ||
      line.startsWith(_$.WAYSTONE_HELP) ||
      line.startsWith(_$.JEWEL_HELP) ||
      line.startsWith(_$.SANCTUM_HELP) ||
      line.startsWith(_$.PRECURSOR_TABLET_HELP) ||
      line.startsWith(_$.LOGBOOK_HELP) ||
      line.startsWith(_$.GRANTS_SKILL)
    ) {
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}
function parseTimelostRadius(section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Jewel) return "PARSER_SKIPPED";
  for (const line of section) {
    if (line.startsWith(_$.TIMELESS_RADIUS)) {
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

function parseSentinelCharge(section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Sentinel) return "PARSER_SKIPPED";

  if (section.length === 1) {
    if (section[0].startsWith(_$.SENTINEL_CHARGE)) {
      item.sentinelCharge = parseInt(
        section[0].slice(_$.SENTINEL_CHARGE.length),
        10,
      );
      return "SECTION_PARSED";
    }
  }
  return "SECTION_SKIPPED";
}

function parseSynthesised(section: string[], item: ParserState) {
  if (section.length === 1) {
    if (section[0] === _$.SECTION_SYNTHESISED) {
      item.isSynthesised = true;
      if (item.baseType) {
        item.baseType = _$REF.ITEM_SYNTHESISED.exec(item.baseType)![1];
      } else {
        item.name = _$REF.ITEM_SYNTHESISED.exec(item.name)![1];
      }
      return "SECTION_PARSED";
    }
  }

  return "SECTION_SKIPPED";
}

function parseSuperior(item: ParserState) {
  if (
    item.rarity === ItemRarity.Normal ||
    (item.rarity === ItemRarity.Magic && item.isUnidentified) ||
    (item.rarity === ItemRarity.Rare && item.isUnidentified) ||
    (item.rarity === ItemRarity.Unique && item.isUnidentified)
  ) {
    if (_$.ITEM_SUPERIOR.test(item.name)) {
      item.name = _$REF.ITEM_SUPERIOR.exec(item.name)![1];
    }
  }
}

function parseCategoryByHelpText(section: string[], item: ParsedItem) {
  if (section[0] === _$.BEAST_HELP) {
    item.category = ItemCategory.CapturedBeast;
    return "SECTION_PARSED";
  } else if (section[0] === _$.METAMORPH_HELP) {
    item.category = ItemCategory.MetamorphSample;
    return "SECTION_PARSED";
  } else if (section[0] === _$.VOIDSTONE_HELP) {
    item.category = ItemCategory.Voidstone;
    return "SECTION_PARSED";
  }

  return "SECTION_SKIPPED";
}

function parseHeistBlueprint(section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.HeistBlueprint) return "PARSER_SKIPPED";

  parseAreaLevelNested(section, item);
  if (!item.areaLevel) {
    return "SECTION_SKIPPED";
  }

  item.heist = {};

  for (const line of section) {
    if (line.startsWith(_$.HEIST_TARGET)) {
      const targetText = line.slice(_$.HEIST_TARGET.length);
      switch (targetText) {
        case _$.HEIST_BLUEPRINT_ENCHANTS:
          item.heist.target = "Enchants";
          break;
        case _$.HEIST_BLUEPRINT_GEMS:
          item.heist.target = "Gems";
          break;
        case _$.HEIST_BLUEPRINT_REPLICAS:
          item.heist.target = "Replicas";
          break;
        case _$.HEIST_BLUEPRINT_TRINKETS:
          item.heist.target = "Trinkets";
          break;
      }
    } else if (line.startsWith(_$.HEIST_WINGS_REVEALED)) {
      item.heist.wingsRevealed = parseInt(
        line.slice(_$.HEIST_WINGS_REVEALED.length),
        10,
      );
    }
  }

  return "SECTION_PARSED";
}

function parseAreaLevelNested(section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.AREA_LEVEL)) {
      item.areaLevel = Number(line.slice(_$.AREA_LEVEL.length));
      break;
    }
  }
}

function parseAreaLevel(section: string[], item: ParsedItem) {
  if (
    item.info.refName !== "Chronicle of Atzoatl" &&
    item.info.refName !== "Expedition Logbook" &&
    item.info.refName !== "Mirrored Tablet" &&
    item.info.refName !== "Forbidden Tome"
  )
    return "PARSER_SKIPPED";

  parseAreaLevelNested(section, item);

  return item.areaLevel ? "SECTION_PARSED" : "SECTION_SKIPPED";
}

function parseAtzoatlRooms(section: string[], item: ParsedItem) {
  if (item.info.refName !== "Chronicle of Atzoatl") return "PARSER_SKIPPED";
  if (section[0] !== _$.INCURSION_OPEN) return "SECTION_SKIPPED";

  let state = IncursionRoom.Open;
  for (const line of section.slice(1)) {
    if (line === _$.INCURSION_OBSTRUCTED) {
      state = IncursionRoom.Obstructed;
      continue;
    }

    const found = STAT_BY_MATCH_STR(line);
    if (found) {
      item.newMods.push({
        info: { tags: [], type: ModifierType.Pseudo },
        stats: [
          {
            stat: found.stat,
            translation: {
              string:
                state === IncursionRoom.Open
                  ? found.matcher.string
                  : `${_$.INCURSION_OBSTRUCTED} ${found.matcher.string}`,
            },
            roll: {
              value: state,
              min: state,
              max: state,
              dp: false,
              unscalable: true,
            },
          },
        ],
      });
    } else {
      item.unknownModifiers.push({
        text: line,
        type: ModifierType.Pseudo,
      });
    }
  }

  return "SECTION_PARSED";
}

function parseMirroredTablet(section: string[], item: ParsedItem) {
  if (item.info.refName !== "Mirrored Tablet") return "PARSER_SKIPPED";
  if (section.length < 8) return "SECTION_SKIPPED";

  for (const line of section) {
    const found = tryParseTranslation(
      { string: line, unscalable: true },
      ModifierType.Pseudo,
    );
    if (found) {
      item.newMods.push({
        info: { tags: [], type: ModifierType.Pseudo },
        stats: [found],
      });
    } else {
      item.unknownModifiers.push({
        text: line,
        type: ModifierType.Pseudo,
      });
    }
  }

  return "SECTION_PARSED";
}

function parseFilledCoffin(section: string[], item: ParsedItem) {
  if (item.info.refName !== "Filled Coffin") return "PARSER_SKIPPED";
  if (!section.some((line) => line.endsWith(IMPLICIT_LINE)))
    return "SECTION_SKIPPED";

  const { lines } = parseModType(section);
  const modInfo: ModifierInfo = {
    type: ModifierType.Necropolis,
    tags: [],
  };
  parseStatsFromMod(lines, item, { info: modInfo, stats: [] });

  return "SECTION_PARSED";
}

function markupConditionParser(text: string) {
  // ignores state set by <<set:__>>
  // always evaluates first condition to true <if:__>{...}
  // full markup: https://gist.github.com/SnosMe/151549b532df8ea08025a76ae2920ca4

  text = text.replace(/<<set:.+?>>/g, "");
  text = text.replace(
    /<(if:.+?|elif:.+?|else)>{(.+?)}/g,
    (_, type: string, body: string) => {
      return type.startsWith("if:") ? body : "";
    },
  );

  return text;
}

function parseStatsFromMod(
  lines: string[],
  item: ParsedItem,
  modifier: ParsedModifier,
): boolean {
  item.newMods.push(modifier);

  if (modifier.info.type === ModifierType.Veiled) {
    const found = STAT_BY_MATCH_STR(modifier.info.name!);
    if (found) {
      modifier.stats.push({
        stat: found.stat,
        translation: found.matcher,
      });
    } else {
      if (item.rarity !== ItemRarity.Unique) {
        item.unknownModifiers.push({
          text: modifier.info.name!,
          type: modifier.info.type,
        });
      }
    }
    return true;
  }

  const statIterator = linesToStatStrings(lines);
  let stat = statIterator.next();
  while (!stat.done) {
    const parsedStat = tryParseTranslation(stat.value, modifier.info.type);
    if (parsedStat) {
      modifier.stats.push(parsedStat);

      stat = statIterator.next(true);
    } else {
      stat = statIterator.next(false);
    }
  }

  if (item.rarity !== ItemRarity.Unique) {
    item.unknownModifiers.push(
      ...stat.value.map((line) => ({
        text: line,
        type: modifier.info.type,
      })),
    );
  }
  return true;
}

/**
 * @deprecated
 */
function transformToLegacyModifiers(item: ParsedItem) {
  item.statsByType = sumStatsByModType(item.newMods);
}

function applyElementalAdded(item: ParsedItem) {
  if (item.weaponELEMENTAL && item.rarity !== "Unique") {
    const knownRefs = new Set<string>([
      "Adds # to # Lightning Damage",
      "Adds # to # Cold Damage",
      "Adds # to # Fire Damage",
    ]);

    item.statsByType.forEach((calc) => {
      if (knownRefs.has(calc.stat.ref)) {
        for (const source of calc.sources) {
          if (calc.stat.ref === "Adds # to # Lightning Damage") {
            if (item.weaponLIGHTNING) {
              item.weaponLIGHTNING =
                source.contributes!.value + item.weaponLIGHTNING;
            } else {
              item.weaponLIGHTNING = source.contributes!.value;
            }
          } else if (calc.stat.ref === "Adds # to # Cold Damage") {
            if (item.weaponCOLD) {
              item.weaponCOLD = source.contributes!.value + item.weaponCOLD;
            } else {
              item.weaponCOLD = source.contributes!.value;
            }
          } else if (calc.stat.ref === "Adds # to # Fire Damage") {
            if (item.weaponFIRE) {
              item.weaponFIRE = source.contributes!.value + item.weaponFIRE;
            } else {
              item.weaponFIRE = source.contributes!.value;
            }
          }
        }
      }
    });
  }
}

function calcBasePercentile(item: ParsedItem) {
  const info = item.info.unique
    ? ITEM_BY_REF("ITEM", item.info.unique.base)![0].armour
    : item.info.armour;
  if (!info) return;

  // Base percentile is the same for all defences.
  // Using `AR/EV -> ES` order to improve accuracy
  // of calculation (larger rolls = more precise).
  if (item.armourAR && info.ar) {
    item.basePercentile = calcPropPercentile(
      item.armourAR,
      info.ar,
      QUALITY_STATS.ARMOUR,
      item,
    );
  } else if (item.armourEV && info.ev) {
    item.basePercentile = calcPropPercentile(
      item.armourEV,
      info.ev,
      QUALITY_STATS.EVASION,
      item,
    );
  } else if (item.armourES && info.es) {
    item.basePercentile = calcPropPercentile(
      item.armourES,
      info.es,
      QUALITY_STATS.ENERGY_SHIELD,
      item,
    );
  }
}

export function removeLinesEnding(
  lines: readonly string[],
  ending: string,
): string[] {
  return lines.map((line) =>
    line.endsWith(ending) ? line.slice(0, -ending.length) : line,
  );
}

export function parseAffixStrings(clipboard: string): string {
  return clipboard.replace(/\[([^\]|]+)\|?([^\]]*)\]/g, (_, part1, part2) => {
    return part2 || part1;
  });
}
function getMaxSockets(category: ItemCategory | undefined) {
  switch (category) {
    case ItemCategory.BodyArmour:
    case ItemCategory.TwoHandedAxe:
    case ItemCategory.TwoHandedMace:
    case ItemCategory.TwoHandedSword:
    case ItemCategory.Crossbow:
    case ItemCategory.Bow:
    case ItemCategory.Warstaff:
    case ItemCategory.Staff:
      return 2;
    case ItemCategory.Helmet:
    case ItemCategory.Shield:
    case ItemCategory.Gloves:
    case ItemCategory.Boots:
    case ItemCategory.OneHandedAxe:
    case ItemCategory.OneHandedMace:
    case ItemCategory.OneHandedSword:
    case ItemCategory.Claw:
    case ItemCategory.Dagger:
    case ItemCategory.Focus:
    case ItemCategory.Spear:
    case ItemCategory.Flail:
    case ItemCategory.Wand:
    case ItemCategory.Buckler:
    case ItemCategory.Sceptre:
      return 1;
    default:
      return 0;
  }
}

export function isArmourOrWeaponOrCaster(
  category: ItemCategory | undefined,
): "armour" | "weapon" | "caster" | undefined {
  switch (category) {
    case ItemCategory.BodyArmour:
    case ItemCategory.Boots:
    case ItemCategory.Gloves:
    case ItemCategory.Helmet:
    case ItemCategory.Shield:
    case ItemCategory.Focus:
    case ItemCategory.Buckler:
      return "armour";
    case ItemCategory.OneHandedAxe:
    case ItemCategory.OneHandedMace:
    case ItemCategory.OneHandedSword:
    case ItemCategory.Quiver:
    case ItemCategory.Claw:
    case ItemCategory.Dagger:
    case ItemCategory.Sceptre:
    case ItemCategory.TwoHandedAxe:
    case ItemCategory.TwoHandedMace:
    case ItemCategory.TwoHandedSword:
    case ItemCategory.Crossbow:
    case ItemCategory.Bow:
    case ItemCategory.Warstaff:
    case ItemCategory.Spear:
    case ItemCategory.Flail:
      return "weapon";
    case ItemCategory.Wand:
    case ItemCategory.Staff:
      return "caster";
    default:
      return undefined;
  }
}

function runeCount(mod: ParsedModifier, statCalc: StatCalculated): number {
  if (mod.info.type !== ModifierType.Rune) return 0;
  // HACK: fix since I can't detect how many exist due to rune tiers
  // const runeTradeId = statCalc.stat.trade.ids[ModifierType.Rune][0];
  // const runeSingle = RUNE_SINGLE_VALUE[runeTradeId];

  // // Calculate how many of this rune are in the item
  // const runeAppliedValue = statCalc.sources[0].contributes!.value;
  // const runeSingleValue = runeSingle.values[0];
  // const totalRunes = Math.floor(runeAppliedValue / runeSingleValue);

  return 1;
}

export function replaceHashWithValues(template: string, values: number[]) {
  let result = template;
  values.forEach((value: number) => {
    result = result.replace("#", value.toString()); // Replace the first occurrence of #
  });
  return result;
}

function isUncutSkillGem(section: string[]): boolean {
  if (section.length !== 2) return false;
  const translated = _$.RARITY + _$.RARITY_CURRENCY;
  return section[0] === translated && section[1] !== undefined;
}

// Disable since this is export for tests
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __testExports = {
  itemTextToSections,
  parseNamePlate,
  isUncutSkillGem,
};
