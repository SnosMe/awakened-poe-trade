import {
  CLIENT_STRINGS as _$,
  CLIENT_STRINGS_REF as _$REF,
  ITEM_BY_TRANSLATED,
  ITEM_BY_REF,
  STAT_BY_MATCH_STR,
  BaseType
} from '@/assets/data'
import { ModifierType, sumStatsByModType } from './modifiers'
import { linesToStatStrings, tryParseTranslation, getRollOrMinmaxAvg } from './stat-translations'
import { ItemCategory } from './meta'
import { IncursionRoom, ParsedItem, ItemInfluence, ItemRarity } from './ParsedItem'
import { magicBasetype } from './magic-name'
import { isModInfoLine, groupLinesByMod, parseModInfoLine, parseModType, ModifierInfo, ParsedModifier, ENCHANT_LINE, SCOURGE_LINE } from './advanced-mod-desc'

type SectionParseResult =
  | 'SECTION_PARSED'
  | 'SECTION_SKIPPED'
  | 'PARSER_SKIPPED'

type ParserFn = (section: string[], item: ParserState) => SectionParseResult
type VirtualParserFn = (item: ParserState) => void

export interface ParserState extends ParsedItem {
  name: string
  baseType: string | undefined
  infoVariants: BaseType[]
}

const parsers: Array<ParserFn | { virtual: VirtualParserFn }> = [
  parseUnidentified,
  { virtual: parseSuperior },
  parseSynthesised,
  parseCategoryByHelpText,
  { virtual: normalizeName },
  { virtual: parseGemAltQuality },
  parseVaalGemName,
  { virtual: findInDatabase },
  // -----------
  parseItemLevel,
  parseTalismanTier,
  parseGem,
  parseArmour,
  parseWeapon,
  parseFlask,
  parseStackSize,
  parseCorrupted,
  parseRelic,
  parseInfluence,
  parseMap,
  parseSockets,
  parseHeistBlueprint,
  parseAreaLevel,
  parseAtzoatlRooms,
  parseMirrored,
  parseSentinelCharge,
  parseLogbookArea,
  parseLogbookArea,
  parseLogbookArea,
  parseModifiers, // enchant
  parseModifiers, // scourge
  parseModifiers, // implicit
  parseModifiers, // explicit
  { virtual: transformToLegacyModifiers },
  { virtual: parseFractured },
  { virtual: parseBlightedMap },
  { virtual: pickCorrectVariant }
]

export function parseClipboard (clipboard: string) {
  const lines = clipboard.split(/\r?\n/)
  lines.pop()

  let sections: string[][] = [[]]
  lines.reduce((section, line) => {
    if (line !== '--------') {
      section.push(line)
      return section
    } else {
      const section: string[] = []
      sections.push(section)
      return section
    }
  }, sections[0])
  sections = sections.filter(section => section.length)

  if (sections[0][2] === _$.CANNOT_USE_ITEM) {
    sections[0].pop() // remove CANNOT_USE_ITEM line
    sections[1].unshift(...sections[0]) // prepend item class & rarity into second section
    sections.shift() // remove first section where CANNOT_USE_ITEM line was
  }
  const parsed = parseNamePlate(sections[0])
  if (!parsed) {
    return null
  }

  sections.shift()
  parsed.rawText = clipboard

  // each section can be parsed at most by one parser
  for (const parser of parsers) {
    if (typeof parser === 'object') {
      parser.virtual(parsed)
      continue
    }

    for (const section of sections) {
      const result = parser(section, parsed)
      if (result === 'SECTION_PARSED') {
        sections = sections.filter(s => s !== section)
        break
      } else if (result === 'PARSER_SKIPPED') {
        break
      }
    }
  }

  return Object.freeze(parsed)
}

function normalizeName (item: ParserState) {
  if (item.rarity === ItemRarity.Magic) {
    const baseType = magicBasetype(item.name)
    if (baseType) {
      item.name = baseType
    }
  }

  if (item.rarity === ItemRarity.Normal ||
      item.rarity === ItemRarity.Rare
  ) {
    if (item.baseType) {
      if (_$REF.MAP_BLIGHTED.test(item.baseType)) {
        item.baseType = _$REF.MAP_BLIGHTED.exec(item.baseType)![1]
      } else if (_$REF.MAP_BLIGHT_RAVAGED.test(item.baseType)) {
        item.baseType = _$REF.MAP_BLIGHT_RAVAGED.exec(item.baseType)![1]
      }
    } else {
      if (_$REF.MAP_BLIGHTED.test(item.name)) {
        item.name = _$REF.MAP_BLIGHTED.exec(item.name)![1]
      } else if (_$REF.MAP_BLIGHT_RAVAGED.test(item.name)) {
        item.name = _$REF.MAP_BLIGHT_RAVAGED.exec(item.name)![1]
      }
    }
  }

  if (item.category === ItemCategory.MetamorphSample) {
    if (_$REF.METAMORPH_BRAIN.test(item.name)) {
      item.name = 'Metamorph Brain'
    } else if (_$REF.METAMORPH_EYE.test(item.name)) {
      item.name = 'Metamorph Eye'
    } else if (_$REF.METAMORPH_LUNG.test(item.name)) {
      item.name = 'Metamorph Lung'
    } else if (_$REF.METAMORPH_HEART.test(item.name)) {
      item.name = 'Metamorph Heart'
    } else if (_$REF.METAMORPH_LIVER.test(item.name)) {
      item.name = 'Metamorph Liver'
    }
  }
}

function findInDatabase (item: ParserState) {
  let info: BaseType[] | undefined
  if (item.category === ItemCategory.DivinationCard) {
    info = ITEM_BY_REF('DIVINATION_CARD', item.name)
  } else if (item.category === ItemCategory.CapturedBeast) {
    info = ITEM_BY_REF('CAPTURED_BEAST', item.baseType ?? item.name)
  } else if (item.category === ItemCategory.Gem) {
    info = ITEM_BY_REF('GEM', item.name)
  } else if (item.category === ItemCategory.MetamorphSample) {
    info = ITEM_BY_REF('ITEM', item.name)
  } else if (item.category === ItemCategory.Voidstone) {
    info = ITEM_BY_REF('ITEM', 'Charged Compass')
  } else if (item.rarity === ItemRarity.Unique && !item.isUnidentified) {
    info = ITEM_BY_REF('UNIQUE', item.name)
  } else {
    info = ITEM_BY_REF('ITEM', item.baseType ?? item.name)
  }
  if (!info?.length) {
    throw new Error('UNKNOWN_ITEM')
  }
  if (info[0].unique) {
    info = info.filter(info => info.unique!.base === item.baseType)
  }
  item.infoVariants = info
  // choose 1st variant, correct one will be picked at the end of parsing
  item.info = info[0]
  // same for every variant
  if (!item.category) {
    if (item.info.craftable) {
      item.category = item.info.craftable.category
    } else if (item.info.unique) {
      item.category = ITEM_BY_REF('ITEM',
        item.info.unique.base)![0].craftable!.category
    }
  }
}

function parseMap (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.MAP_TIER)) {
    item.mapTier = Number(section[0].slice(_$.MAP_TIER.length))
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseBlightedMap (item: ParsedItem) {
  if (item.category !== ItemCategory.Map) return

  const calc = item.statsByType.find(calc =>
    calc.type === ModifierType.Implicit &&
    calc.stat.ref.startsWith('Area is infested with Fungal Growths'))
  if (calc !== undefined) {
    if (calc.sources[0].contributes!.value === 9) {
      item.mapBlighted = 'Blight-ravaged'
      item.info.icon = ITEM_BY_REF('ITEM', 'Blight-ravaged Map')![0].icon
    } else {
      item.mapBlighted = 'Blighted'
      item.info.icon = ITEM_BY_REF('ITEM', 'Blighted Map')![0].icon
    }
  }
}

function parseFractured (item: ParserState) {
  if (item.newMods.some(mod => mod.info.type === ModifierType.Fractured)) {
    item.isFractured = true
  }
}

function pickCorrectVariant (item: ParserState) {
  if (!item.info.disc) return

  for (const variant of item.infoVariants) {
    const cond = variant.disc!

    if (cond.propAR && !item.armourAR) continue
    if (cond.propEV && !item.armourEV) continue
    if (cond.propES && !item.armourES) continue

    if (cond.mapTier === 'W' && !(item.mapTier! <= 5)) continue
    if (cond.mapTier === 'Y' && !(item.mapTier! >= 6 && item.mapTier! <= 10)) continue
    if (cond.mapTier === 'R' && !(item.mapTier! >= 11)) continue

    if (cond.hasImplicit && !item.statsByType.some(calc =>
      calc.type === ModifierType.Implicit &&
      calc.stat.ref === cond.hasImplicit!.ref)
    ) continue

    if (cond.hasExplicit && !item.statsByType.some(calc =>
      calc.type === ModifierType.Explicit &&
      calc.stat.ref === cond.hasExplicit!.ref)
    ) continue

    if (cond.sectionText && !item.rawText.includes(cond.sectionText)) continue

    item.info = variant
  }

  // it may happen that we don't find correct variant
  // i.e. corrupted implicit on Two-Stone Ring
}

function parseNamePlate (section: string[]) {
  if (section.length < 3 ||
      !section[0].startsWith(_$.ITEM_CLASS) ||
      !section[1].startsWith(_$.RARITY)) {
    return null
  }

  const item: ParserState = {
    rarity: undefined,
    category: undefined,
    name: markupConditionParser(section[2]),
    baseType: (section.length >= 4) ? markupConditionParser(section[3]) : undefined,
    isUnidentified: false,
    isCorrupted: false,
    newMods: [],
    statsByType: [],
    unknownModifiers: [],
    influences: [],
    info: undefined!,
    infoVariants: undefined!,
    rawText: undefined!
  }

  const rarityText = section[1].slice(_$.RARITY.length)
  switch (rarityText) {
    case _$.RARITY_CURRENCY:
      item.category = ItemCategory.Currency
      break
    case _$.RARITY_DIVCARD:
      item.category = ItemCategory.DivinationCard
      break
    case _$.RARITY_GEM:
      item.category = ItemCategory.Gem
      break
    case _$.RARITY_NORMAL:
      item.rarity = ItemRarity.Normal
      break
    case _$.RARITY_MAGIC:
      item.rarity = ItemRarity.Magic
      break
    case _$.RARITY_RARE:
      item.rarity = ItemRarity.Rare
      break
    case _$.RARITY_UNIQUE:
      item.rarity = ItemRarity.Unique
      break
    default:
      return null
  }

  return item
}

function parseInfluence (section: string[], item: ParsedItem) {
  if (section.length <= 2) {
    const countBefore = item.influences.length

    for (const line of section) {
      switch (line) {
        case _$.INFLUENCE_CRUSADER:
          item.influences.push(ItemInfluence.Crusader)
          break
        case _$.INFLUENCE_ELDER:
          item.influences.push(ItemInfluence.Elder)
          break
        case _$.INFLUENCE_SHAPER:
          item.influences.push(ItemInfluence.Shaper)
          break
        case _$.INFLUENCE_HUNTER:
          item.influences.push(ItemInfluence.Hunter)
          break
        case _$.INFLUENCE_REDEEMER:
          item.influences.push(ItemInfluence.Redeemer)
          break
        case _$.INFLUENCE_WARLORD:
          item.influences.push(ItemInfluence.Warlord)
          break
      }
    }

    if (countBefore < item.influences.length) {
      return 'SECTION_PARSED'
    }
  }
  return 'SECTION_SKIPPED'
}

function parseCorrupted (section: string[], item: ParsedItem) {
  if (section[0] === _$.CORRUPTED) {
    item.isCorrupted = true
    return 'SECTION_PARSED'
  } else if (section[0] === _$.UNMODIFIABLE) {
    item.isCorrupted = true
    item.isUnmodifiable = true
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseRelic (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Unique) {
    return 'PARSER_SKIPPED'
  }
  if (section[0] === _$.RELIC_UNIQUE) {
    item.isRelic = true
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseUnidentified (section: string[], item: ParsedItem) {
  if (section[0] === _$.UNIDENTIFIED) {
    item.isUnidentified = true
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseItemLevel (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.ITEM_LEVEL)) {
    item.itemLevel = Number(section[0].slice(_$.ITEM_LEVEL.length))
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseTalismanTier (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.TALISMAN_TIER)) {
    item.talismanTier = Number(section[0].slice(_$.TALISMAN_TIER.length))
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseVaalGemName (section: string[], item: ParserState) {
  if (item.category !== ItemCategory.Gem) return 'PARSER_SKIPPED'

  // TODO blocked by https://www.pathofexile.com/forum/view-thread/3231236
  if (section.length === 1) {
    let gemName: string | undefined
    if ((gemName = _$.QUALITY_ANOMALOUS.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Anomalous'
    } else if ((gemName = _$.QUALITY_DIVERGENT.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Divergent'
    } else if ((gemName = _$.QUALITY_PHANTASMAL.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Phantasmal'
    } else if (ITEM_BY_TRANSLATED('GEM', section[0])) {
      gemName = section[0]
      item.gemAltQuality = 'Superior'
    }
    if (gemName) {
      item.name = ITEM_BY_TRANSLATED('GEM', gemName)![0].refName
      return 'SECTION_PARSED'
    }
  }
  return 'SECTION_SKIPPED'
}

function parseGem (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Gem) {
    return 'PARSER_SKIPPED'
  }
  if (section[1]?.startsWith(_$.GEM_LEVEL)) {
    // "Level: 20 (Max)"
    item.gemLevel = parseInt(section[1].slice(_$.GEM_LEVEL.length), 10)

    parseQualityNested(section, item)

    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseGemAltQuality (item: ParserState) {
  if (item.category !== ItemCategory.Gem) return

  let gemName: string | undefined
  if ((gemName = _$REF.QUALITY_ANOMALOUS.exec(item.name)?.[1])) {
    item.gemAltQuality = 'Anomalous'
  } else if ((gemName = _$REF.QUALITY_DIVERGENT.exec(item.name)?.[1])) {
    item.gemAltQuality = 'Divergent'
  } else if ((gemName = _$REF.QUALITY_PHANTASMAL.exec(item.name)?.[1])) {
    item.gemAltQuality = 'Phantasmal'
  } else {
    item.gemAltQuality = 'Superior'
  }
  if (gemName) {
    item.name = gemName
  }
}

function parseStackSize (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Normal &&
      item.category !== ItemCategory.Currency &&
      item.category !== ItemCategory.DivinationCard) {
    return 'PARSER_SKIPPED'
  }
  if (section[0].startsWith(_$.STACK_SIZE)) {
    // Portal Scroll "Stack Size: 2[localized separator]448/40"
    const [value, max] = section[0].slice(_$.STACK_SIZE.length).replace(/[^\d/]/g, '').split('/').map(Number)
    item.stackSize = { value, max }

    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseSockets (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.SOCKETS)) {
    let sockets = section[0].slice(_$.SOCKETS.length).trimEnd()

    item.sockets = {
      white: (sockets.split('W').length - 1),
      linked: undefined
    }

    sockets = sockets.replace(/[^ -]/g, '#')
    if (sockets === '#-#-#-#-#-#') {
      item.sockets.linked = 6
    } else if (
      sockets === '# #-#-#-#-#' ||
      sockets === '#-#-#-#-# #' ||
      sockets === '#-#-#-#-#'
    ) {
      item.sockets.linked = 5
    }
    return 'SECTION_PARSED'
  }
  return 'SECTION_SKIPPED'
}

function parseQualityNested (section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.QUALITY)) {
      // "Quality: +20% (augmented)"
      item.quality = parseInt(line.slice(_$.QUALITY.length), 10)
      break
    }
  }
}

function parseArmour (section: string[], item: ParsedItem) {
  let isParsed: SectionParseResult = 'SECTION_SKIPPED'

  for (const line of section) {
    if (line.startsWith(_$.ARMOUR)) {
      item.armourAR = parseInt(line.slice(_$.ARMOUR.length), 10)
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.EVASION)) {
      item.armourEV = parseInt(line.slice(_$.EVASION.length), 10)
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.ENERGY_SHIELD)) {
      item.armourES = parseInt(line.slice(_$.ENERGY_SHIELD.length), 10)
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.TAG_WARD)) {
      item.armourWARD = parseInt(line.slice(_$.TAG_WARD.length), 10)
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.BLOCK_CHANCE)) {
      item.armourBLOCK = parseInt(line.slice(_$.BLOCK_CHANCE.length), 10)
      isParsed = 'SECTION_PARSED'; continue
    }
  }

  if (isParsed === 'SECTION_PARSED') {
    parseQualityNested(section, item)
  }

  return isParsed
}

function parseWeapon (section: string[], item: ParsedItem) {
  let isParsed: SectionParseResult = 'SECTION_SKIPPED'

  for (const line of section) {
    if (line.startsWith(_$.CRIT_CHANCE)) {
      item.weaponCRIT = parseFloat(line.slice(_$.CRIT_CHANCE.length))
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.ATTACK_SPEED)) {
      item.weaponAS = parseFloat(line.slice(_$.ATTACK_SPEED.length))
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.PHYSICAL_DAMAGE)) {
      item.weaponPHYSICAL = getRollOrMinmaxAvg(line
        .slice(_$.PHYSICAL_DAMAGE.length)
        .split('-').map(str => parseInt(str, 10))
      )
      isParsed = 'SECTION_PARSED'; continue
    }
    if (line.startsWith(_$.ELEMENTAL_DAMAGE)) {
      item.weaponELEMENTAL =
        line.slice(_$.ELEMENTAL_DAMAGE.length)
          .split(', ')
          .map(element => getRollOrMinmaxAvg(element.split('-').map(str => parseInt(str, 10))))
          .reduce((sum, x) => sum + x, 0)

      isParsed = 'SECTION_PARSED'; continue
    }
  }

  if (isParsed === 'SECTION_PARSED') {
    parseQualityNested(section, item)
  }

  return isParsed
}

function parseLogbookArea (section: string[], item: ParsedItem) {
  if (item.info.refName !== 'Expedition Logbook') return 'PARSER_SKIPPED'
  if (section.length < 3) return 'SECTION_SKIPPED'

  // skip Area, parse Faction
  const faction = STAT_BY_MATCH_STR(section[1])
  if (!faction) return 'SECTION_SKIPPED'

  const areaMods: ParsedModifier[] = [{
    info: { tags: [], type: ModifierType.Pseudo },
    stats: [{
      stat: faction.stat,
      translation: faction.matcher
    }]
  }]

  const { modType, lines } = parseModType(section.slice(2))
  for (const line of lines) {
    const found = STAT_BY_MATCH_STR(line)
    if (found && found.stat.ref === 'Area contains an Expedition Boss (#)') {
      const roll = found.matcher.value!
      areaMods.push({
        info: { tags: [], type: modType },
        stats: [{
          stat: found.stat,
          translation: found.matcher,
          roll: { value: roll, min: roll, max: roll, dp: false, unscalable: true }
        }]
      })
    }
  }

  if (!item.logbookAreaMods) {
    item.logbookAreaMods = [areaMods]
  } else {
    item.logbookAreaMods.push(areaMods)
  }

  return 'SECTION_PARSED'
}

function parseModifiers (section: string[], item: ParsedItem) {
  if (
    item.rarity !== ItemRarity.Normal &&
    item.rarity !== ItemRarity.Magic &&
    item.rarity !== ItemRarity.Rare &&
    item.rarity !== ItemRarity.Unique
  ) {
    return 'PARSER_SKIPPED'
  }

  const recognizedLine = section.find(line =>
    line.endsWith(ENCHANT_LINE) ||
    line.endsWith(SCOURGE_LINE) ||
    isModInfoLine(line)
  )

  if (!recognizedLine) {
    return 'SECTION_SKIPPED'
  }

  if (isModInfoLine(recognizedLine)) {
    for (const { modLine, statLines } of groupLinesByMod(section)) {
      const { modType, lines } = parseModType(statLines)
      const modInfo = parseModInfoLine(modLine, modType)
      parseStatsFromMod(lines, item, { info: modInfo, stats: [] })

      if (modType === ModifierType.Veiled) {
        item.isVeiled = true
      }
    }
  } else {
    const { lines } = parseModType(section)
    const modInfo: ModifierInfo = {
      type: recognizedLine.endsWith(ENCHANT_LINE)
        ? ModifierType.Enchant
        : ModifierType.Scourge,
      tags: []
    }
    parseStatsFromMod(lines, item, { info: modInfo, stats: [] })
  }

  return 'SECTION_PARSED'
}

function parseMirrored (section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$.MIRRORED) {
      item.isMirrored = true
      return 'SECTION_PARSED'
    }
  }
  return 'SECTION_SKIPPED'
}

function parseFlask (section: string[], item: ParsedItem) {
  // the purpose of this parser is to "consume" flask buffs
  // so they are not recognized as modifiers

  let isParsed: SectionParseResult = 'SECTION_SKIPPED'

  for (const line of section) {
    if (_$.FLASK_CHARGES.test(line)) {
      isParsed = 'SECTION_PARSED'; break
    }
  }

  if (isParsed) {
    parseQualityNested(section, item)
  }

  return isParsed
}

function parseSentinelCharge (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Sentinel) return 'PARSER_SKIPPED'

  if (section.length === 1) {
    if (section[0].startsWith(_$.SENTINEL_CHARGE)) {
      item.sentinelCharge = parseInt(section[0].slice(_$.SENTINEL_CHARGE.length), 10)
      return 'SECTION_PARSED'
    }
  }
  return 'SECTION_SKIPPED'
}

function parseSynthesised (section: string[], item: ParserState) {
  if (section.length === 1) {
    if (section[0] === _$.SECTION_SYNTHESISED) {
      item.isSynthesised = true
      if (item.baseType) {
        item.baseType = _$REF.ITEM_SYNTHESISED.exec(item.baseType)![1]
      } else {
        item.name = _$REF.ITEM_SYNTHESISED.exec(item.name)![1]
      }
      return 'SECTION_PARSED'
    }
  }

  return 'SECTION_SKIPPED'
}

function parseSuperior (item: ParserState) {
  if (
    (item.rarity === ItemRarity.Normal) ||
    (item.rarity === ItemRarity.Magic && item.isUnidentified) ||
    (item.rarity === ItemRarity.Rare && item.isUnidentified) ||
    (item.rarity === ItemRarity.Unique && item.isUnidentified)
  ) {
    if (_$REF.ITEM_SUPERIOR.test(item.name)) {
      item.name = _$REF.ITEM_SUPERIOR.exec(item.name)![1]
    }
  }
}

function parseCategoryByHelpText (section: string[], item: ParsedItem) {
  if (section[0] === _$.BEAST_HELP) {
    item.category = ItemCategory.CapturedBeast
    return 'SECTION_PARSED'
  } else if (section[0] === _$.METAMORPH_HELP) {
    item.category = ItemCategory.MetamorphSample
    return 'SECTION_PARSED'
  } else if (section[0] === _$.VOIDSTONE_HELP) {
    item.category = ItemCategory.Voidstone
    return 'SECTION_PARSED'
  }

  return 'SECTION_SKIPPED'
}

function parseHeistBlueprint (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.HeistBlueprint) return 'PARSER_SKIPPED'

  parseAreaLevelNested(section, item)
  if (!item.areaLevel) {
    return 'SECTION_SKIPPED'
  }

  item.heist = {}

  for (const line of section) {
    if (line.startsWith(_$.HEIST_TARGET)) {
      const targetText = line.slice(_$.HEIST_TARGET.length)
      switch (targetText) {
        case _$.HEIST_BLUEPRINT_ENCHANTS:
          item.heist.target = 'Enchants'; break
        case _$.HEIST_BLUEPRINT_GEMS:
          item.heist.target = 'Gems'; break
        case _$.HEIST_BLUEPRINT_REPLICAS:
          item.heist.target = 'Replicas'; break
        case _$.HEIST_BLUEPRINT_TRINKETS:
          item.heist.target = 'Trinkets'; break
      }
    } else if (line.startsWith(_$.HEIST_WINGS_REVEALED)) {
      item.heist.wingsRevealed = parseInt(line.slice(_$.HEIST_WINGS_REVEALED.length), 10)
    }
  }

  return 'SECTION_PARSED'
}

function parseAreaLevelNested (section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.AREA_LEVEL)) {
      item.areaLevel = Number(line.slice(_$.AREA_LEVEL.length))
      break
    }
  }
}

function parseAreaLevel (section: string[], item: ParsedItem) {
  if (
    item.info.refName !== 'Chronicle of Atzoatl' &&
    item.info.refName !== 'Expedition Logbook'
  ) return 'PARSER_SKIPPED'

  parseAreaLevelNested(section, item)

  return (item.areaLevel)
    ? 'SECTION_PARSED'
    : 'SECTION_SKIPPED'
}

function parseAtzoatlRooms (section: string[], item: ParsedItem) {
  if (item.info.refName !== 'Chronicle of Atzoatl') return 'PARSER_SKIPPED'
  if (section[0] !== _$.INCURSION_OPEN) return 'SECTION_SKIPPED'

  let state = IncursionRoom.Open
  for (const line of section.slice(1)) {
    if (line === _$.INCURSION_OBSTRUCTED) {
      state = IncursionRoom.Obstructed
      continue
    }

    const found = STAT_BY_MATCH_STR(line)
    if (found) {
      item.newMods.push({
        info: { tags: [], type: ModifierType.Pseudo },
        stats: [{
          stat: found.stat,
          translation: {
            string: (state === IncursionRoom.Open)
              ? found.matcher.string
              : `${_$.INCURSION_OBSTRUCTED} ${found.matcher.string}`
          },
          roll: { value: state, min: state, max: state, dp: false, unscalable: true }
        }]
      })
    } else {
      item.unknownModifiers.push({
        text: line,
        type: ModifierType.Pseudo
      })
    }
  }

  return 'SECTION_PARSED'
}

function markupConditionParser (text: string) {
  // ignores state set by <<set:__>>
  // always evaluates first condition to true <if:__>{...}
  // full markup: https://gist.github.com/SnosMe/151549b532df8ea08025a76ae2920ca4

  text = text.replace(/<<set:.+?>>/g, '')
  text = text.replace(/<(if:.+?|elif:.+?|else)>{(.+?)}/g, (_, type: string, body: string) => {
    return type.startsWith('if:')
      ? body
      : ''
  })

  return text
}

function parseStatsFromMod (lines: string[], item: ParsedItem, modifier: ParsedModifier) {
  item.newMods.push(modifier)

  if (modifier.info.type === ModifierType.Veiled) {
    const found = STAT_BY_MATCH_STR(modifier.info.name!)
    if (found) {
      modifier.stats.push({
        stat: found.stat,
        translation: found.matcher
      })
    } else {
      item.unknownModifiers.push({
        text: modifier.info.name!,
        type: modifier.info.type
      })
    }
    return
  }

  const statIterator = linesToStatStrings(lines)
  let stat = statIterator.next()
  while (!stat.done) {
    const parsedStat = tryParseTranslation(stat.value, modifier.info.type)
    if (parsedStat) {
      modifier.stats.push(parsedStat)
      stat = statIterator.next(true)
    } else {
      stat = statIterator.next(false)
    }
  }

  item.unknownModifiers.push(...stat.value.map(line => ({
    text: line,
    type: modifier.info.type
  })))
}

/**
 * @deprecated
 */
function transformToLegacyModifiers (item: ParsedItem) {
  item.statsByType = sumStatsByModType(item.newMods)
}

export function removeLinesEnding (
  lines: readonly string[], ending: string
): string[] {
  return lines.map(line =>
    line.endsWith(ending)
      ? line.slice(0, -ending.length)
      : line
  )
}
