import {
  BASE_TYPES,
  CLIENT_STRINGS as _$,
  ITEM_NAME_REF_BY_TRANSLATED,
  STAT_BY_MATCH_STR
} from '@/assets/data'
import { ModifierType, sumStatsByModType } from './modifiers'
import { linesToStatStrings, tryParseTranslation, getRollOrMinmaxAvg } from './stat-translations'
import { ItemCategory } from './meta'
import { HeistJob, IncursionRoom, ParsedItem, ItemInfluence, ItemRarity } from './ParsedItem'
import { magicBasetype } from './magic-name'
import { isModInfoLine, groupLinesByMod, parseModInfoLine, parseModType, ModifierInfo, ParsedModifier, ENCHANT_LINE, SCOURGE_LINE } from './advanced-mod-desc'

const SECTION_PARSED = 1
const SECTION_SKIPPED = 0
const PARSER_SKIPPED = -1

type SectionParseResult =
  typeof SECTION_PARSED |
  typeof SECTION_SKIPPED |
  typeof PARSER_SKIPPED

type ParserFn = (section: string[], item: ParsedItem) => SectionParseResult
type VirtualParserFn = (item: ParsedItem) => void

const parsers: Array<ParserFn | { virtual: VirtualParserFn }> = [
  parseUnidentified,
  { virtual: parseSuperior },
  parseSynthesised,
  parseCategoryByHelpText,
  { virtual: normalizeName },
  // -----------
  parseItemLevel,
  parseTalismanTier,
  parseVaalGem,
  parseGem,
  parseArmour,
  parseWeapon,
  parseFlask,
  parseStackSize,
  parseCorrupted,
  parseInfluence,
  parseMap,
  parseSockets,
  parseProphecyMaster,
  parseHeistMission,
  parseAtzoatlAreaLevel,
  parseAtzoatlRooms,
  parseMirrored,
  parseModifiers, // enchant
  parseModifiers, // scourge
  parseModifiers, // implicit
  parseModifiers, // explicit
  { virtual: transformToLegacyModifiers },
  { virtual: parseBlightedMap }
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
      if (result === SECTION_PARSED) {
        sections = sections.filter(s => s !== section)
        break
      } else if (result === PARSER_SKIPPED) {
        break
      }
    }
  }

  return Object.freeze(parsed)
}

function normalizeName (item: ParsedItem) {
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
      if (_$.MAP_BLIGHTED.test(item.baseType)) {
        item.baseType = _$.MAP_BLIGHTED.exec(item.baseType)![1]
      }
    } else {
      if (_$.MAP_BLIGHTED.test(item.name)) {
        item.name = _$.MAP_BLIGHTED.exec(item.name)![1]
      }
    }
  }

  if (item.category === ItemCategory.MetamorphSample) {
    if (_$.METAMORPH_BRAIN.test(item.name)) {
      item.name = 'Metamorph Brain'
    } else if (_$.METAMORPH_EYE.test(item.name)) {
      item.name = 'Metamorph Eye'
    } else if (_$.METAMORPH_LUNG.test(item.name)) {
      item.name = 'Metamorph Lung'
    } else if (_$.METAMORPH_HEART.test(item.name)) {
      item.name = 'Metamorph Heart'
    } else if (_$.METAMORPH_LIVER.test(item.name)) {
      item.name = 'Metamorph Liver'
    }
  }

  item.name = ITEM_NAME_REF_BY_TRANSLATED.get(item.name) || item.name
  if (item.baseType) {
    item.baseType = ITEM_NAME_REF_BY_TRANSLATED.get(item.baseType) || item.baseType
  }

  if (!item.category) {
    const baseType = BASE_TYPES.get(item.baseType || item.name)
    item.category = baseType?.category
    item.icon = baseType?.icon
  }
}

function parseMap (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.MAP_TIER)) {
    item.mapTier = Number(section[0].substr(_$.MAP_TIER.length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseBlightedMap (item: ParsedItem) {
  if (item.category !== ItemCategory.Map) return

  const stat = item.statsByType.find(calc =>
    calc.type === ModifierType.Implicit &&
    calc.stat.ref.startsWith('Area is infested with Fungal Growths'))
  if (stat !== undefined) {
    item.mapBlighted = true
  }
}

function parseNamePlate (section: string[]) {
  if (section.length < 3 ||
      !section[0].startsWith(_$.ITEM_CLASS) ||
      !section[1].startsWith(_$.RARITY)) {
    return null
  }

  const item: ParsedItem = {
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
    extra: {},
    rawText: undefined!
  }

  const rarityText = section[1].substr(_$.RARITY.length)
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
      return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseCorrupted (section: string[], item: ParsedItem) {
  if (section[0] === _$.CORRUPTED) {
    item.isCorrupted = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseUnidentified (section: string[], item: ParsedItem) {
  if (section[0] === _$.UNIDENTIFIED) {
    item.isUnidentified = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseItemLevel (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.ITEM_LEVEL)) {
    item.itemLevel = Number(section[0].substr(_$.ITEM_LEVEL.length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseTalismanTier (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.TALISMAN_TIER)) {
    item.talismanTier = Number(section[0].substr(_$.TALISMAN_TIER.length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseVaalGem (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Gem) return PARSER_SKIPPED

  if (section.length === 1) {
    let gemName: string | undefined
    if ((gemName = _$.QUALITY_ANOMALOUS.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Anomalous'
    } else if ((gemName = _$.QUALITY_DIVERGENT.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Divergent'
    } else if ((gemName = _$.QUALITY_PHANTASMAL.exec(section[0])?.[1])) {
      item.gemAltQuality = 'Phantasmal'
    } else if (_$.VAAL_GEM.test(section[0])) {
      gemName = section[0]
      item.gemAltQuality = 'Superior'
    }

    if (gemName) {
      item.name = ITEM_NAME_REF_BY_TRANSLATED.get(gemName) || gemName
      return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseGem (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Gem) {
    return PARSER_SKIPPED
  }
  if (section[1]?.startsWith(_$.GEM_LEVEL)) {
    // "Level: 20 (Max)"
    item.gemLevel = parseInt(section[1].substr(_$.GEM_LEVEL.length), 10)

    parseQualityNested(section, item)

    // don't override if parsed in Vaal name section
    if (!item.gemAltQuality) {
      let gemName: string | undefined
      if ((gemName = _$.QUALITY_ANOMALOUS.exec(item.name)?.[1])) {
        item.gemAltQuality = 'Anomalous'
      } else if ((gemName = _$.QUALITY_DIVERGENT.exec(item.name)?.[1])) {
        item.gemAltQuality = 'Divergent'
      } else if ((gemName = _$.QUALITY_PHANTASMAL.exec(item.name)?.[1])) {
        item.gemAltQuality = 'Phantasmal'
      } else {
        item.gemAltQuality = 'Superior'
      }
      if (gemName) {
        item.name = ITEM_NAME_REF_BY_TRANSLATED.get(gemName) || gemName
      }
    }

    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseStackSize (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Normal &&
      item.category !== ItemCategory.Currency &&
      item.category !== ItemCategory.DivinationCard) {
    return PARSER_SKIPPED
  }
  if (section[0].startsWith(_$.STACK_SIZE)) {
    // Portal Scroll "Stack Size: 2[localized separator]448/40"
    const [value, max] = section[0].substr(_$.STACK_SIZE.length).replace(/[^\d/]/g, '').split('/').map(Number)
    item.stackSize = { value, max }

    if (item.category === ItemCategory.Seed) {
      parseSeedLevelNested(section, item)
    }

    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseSeedLevelNested (section: string[], item: ParsedItem) {
  for (const line of section) {
    const match = line.match(_$.SEED_MONSTER_LEVEL)
    if (match != null) {
      item.itemLevel = Number(match[1])
      break
    }
  }
}

function parseSockets (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$.SOCKETS)) {
    let sockets = section[0].substr(_$.SOCKETS.length).trimEnd()

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
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseQualityNested (section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.QUALITY)) {
      // "Quality: +20% (augmented)"
      item.quality = parseInt(line.substr(_$.QUALITY.length), 10)
      break
    }
  }
}

function parseArmour (section: string[], item: ParsedItem) {
  let isParsed = SECTION_SKIPPED as SectionParseResult

  for (const line of section) {
    if (line.startsWith(_$.ARMOUR)) {
      item.armourAR = parseInt(line.substr(_$.ARMOUR.length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.EVASION)) {
      item.armourEV = parseInt(line.substr(_$.EVASION.length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.ENERGY_SHIELD)) {
      item.armourES = parseInt(line.substr(_$.ENERGY_SHIELD.length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.TAG_WARD)) {
      item.armourWARD = parseInt(line.substr(_$.TAG_WARD.length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.BLOCK_CHANCE)) {
      item.armourBLOCK = parseInt(line.substr(_$.BLOCK_CHANCE.length), 10)
      isParsed = SECTION_PARSED; continue
    }
  }

  if (isParsed === SECTION_PARSED) {
    parseQualityNested(section, item)
  }

  return isParsed
}

function parseWeapon (section: string[], item: ParsedItem) {
  let isParsed = SECTION_SKIPPED as SectionParseResult

  for (const line of section) {
    if (line.startsWith(_$.CRIT_CHANCE)) {
      item.weaponCRIT = parseFloat(line.substr(_$.CRIT_CHANCE.length))
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.ATTACK_SPEED)) {
      item.weaponAS = parseFloat(line.substr(_$.ATTACK_SPEED.length))
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.PHYSICAL_DAMAGE)) {
      item.weaponPHYSICAL = getRollOrMinmaxAvg(line
        .substr(_$.PHYSICAL_DAMAGE.length)
        .split('-').map(str => parseInt(str, 10))
      )
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$.ELEMENTAL_DAMAGE)) {
      item.weaponELEMENTAL =
        line.substr(_$.ELEMENTAL_DAMAGE.length)
          .split(', ')
          .map(element => getRollOrMinmaxAvg(element.split('-').map(str => parseInt(str, 10))))
          .reduce((sum, x) => sum + x, 0)

      isParsed = SECTION_PARSED; continue
    }
  }

  if (isParsed === SECTION_PARSED) {
    parseQualityNested(section, item)
  }

  return isParsed
}

function parseModifiers (section: string[], item: ParsedItem) {
  if (
    item.rarity !== ItemRarity.Normal &&
    item.rarity !== ItemRarity.Magic &&
    item.rarity !== ItemRarity.Rare &&
    item.rarity !== ItemRarity.Unique
  ) {
    return PARSER_SKIPPED
  }

  const recognizedLine = section.find(line =>
    line.endsWith(ENCHANT_LINE) ||
    line.endsWith(SCOURGE_LINE) ||
    isModInfoLine(line)
  )

  if (!recognizedLine) {
    return SECTION_SKIPPED
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

  return SECTION_PARSED
}

function parseMirrored (section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$.MIRRORED) {
      item.isMirrored = true
      return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseFlask (section: string[], item: ParsedItem) {
  // the purpose of this parser is to "consume" flask buffs
  // so they are not recognized as modifiers

  for (const line of section) {
    if (_$.FLASK_CHARGES.test(line)) {
      return SECTION_PARSED
    }
  }

  return SECTION_SKIPPED
}

function parseSynthesised (section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$.SECTION_SYNTHESISED) {
      item.isSynthesised = true
      if (item.baseType) {
        item.baseType = _$.ITEM_SYNTHESISED.exec(item.baseType)![1]
      } else {
        item.name = _$.ITEM_SYNTHESISED.exec(item.name)![1]
      }
      return SECTION_PARSED
    }
  }

  return SECTION_SKIPPED
}

function parseSuperior (item: ParsedItem) {
  if (
    (item.rarity === ItemRarity.Normal) ||
    (item.rarity === ItemRarity.Magic && item.isUnidentified) ||
    (item.rarity === ItemRarity.Rare && item.isUnidentified) ||
    (item.rarity === ItemRarity.Unique && item.isUnidentified)
  ) {
    if (_$.ITEM_SUPERIOR.test(item.name)) {
      item.name = _$.ITEM_SUPERIOR.exec(item.name)![1]
    }
  }
}

function parseCategoryByHelpText (section: string[], item: ParsedItem) {
  if (section[0] === _$.PROPHECY_HELP) {
    item.category = ItemCategory.Prophecy
    return SECTION_PARSED
  } else if (section[0] === _$.BEAST_HELP) {
    item.category = ItemCategory.CapturedBeast
    return SECTION_PARSED
  } else if (section[0] === _$.METAMORPH_HELP) {
    item.category = ItemCategory.MetamorphSample
    return SECTION_PARSED
  } else if (section[0].startsWith(_$.SEED_HELP)) {
    item.category = ItemCategory.Seed
    return SECTION_PARSED
  }

  return SECTION_SKIPPED
}

function parseProphecyMaster (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Prophecy) return PARSER_SKIPPED

  if (section[0] === _$.PROPHECY_ALVA) {
    item.extra.prophecyMaster = 'Alva'
    return SECTION_PARSED
  } else if (section[0] === _$.PROPHECY_EINHAR) {
    item.extra.prophecyMaster = 'Einhar'
    return SECTION_PARSED
  } else if (section[0] === _$.PROPHECY_JUN) {
    item.extra.prophecyMaster = 'Jun'
    return SECTION_PARSED
  } else if (section[0] === _$.PROPHECY_NIKO) {
    item.extra.prophecyMaster = 'Niko'
    return SECTION_PARSED
  } else if (section[0] === _$.PROPHECY_ZANA) {
    item.extra.prophecyMaster = 'Zana'
    return SECTION_PARSED
  }

  return SECTION_SKIPPED
}

function parseHeistMission (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.HeistBlueprint &&
      item.category !== ItemCategory.HeistContract) return PARSER_SKIPPED

  parseAreaLevelNested(section, item)
  if (!item.areaLevel) {
    return SECTION_SKIPPED
  }

  if (item.category === ItemCategory.HeistContract) {
    let match = null as RegExpMatchArray | null
    for (const line of section) {
      if ((match = line.match(_$.HEIST_REQUIRED_JOB))) {
        break
      }
    }
    if (!match) throw new Error('never')

    item.heistJob = {
      name: Object.entries(_$.HEIST_JOB)
        .find(([_, tr]) => tr === match!.groups!.job)![0] as HeistJob,
      level: Number(match.groups!.level)
    }
  }

  return SECTION_PARSED
}

function parseAreaLevelNested (section: string[], item: ParsedItem) {
  for (const line of section) {
    if (line.startsWith(_$.AREA_LEVEL)) {
      item.areaLevel = Number(line.substr(_$.AREA_LEVEL.length))
      break
    }
  }
}

function parseAtzoatlAreaLevel (section: string[], item: ParsedItem) {
  if (item.name !== 'Chronicle of Atzoatl') return PARSER_SKIPPED

  parseAreaLevelNested(section, item)

  return (item.areaLevel)
    ? SECTION_PARSED
    : SECTION_SKIPPED
}

function parseAtzoatlRooms (section: string[], item: ParsedItem) {
  if (item.name !== 'Chronicle of Atzoatl') return PARSER_SKIPPED
  if (section[0] !== _$.INCURSION_OPEN) return SECTION_SKIPPED

  let state = IncursionRoom.Open
  for (const line of section.slice(1)) {
    if (line === _$.INCURSION_OBSTRUCTED) {
      state = IncursionRoom.Obstructed
      continue
    }

    const found = STAT_BY_MATCH_STR.get(line)
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

  return SECTION_PARSED
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
    const found = STAT_BY_MATCH_STR.get(modifier.info.name!)
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
