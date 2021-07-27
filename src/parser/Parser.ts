import { ItemRarity, ItemInfluence } from './constants'
import * as C from './constants'
import {
  BASE_TYPES,
  CLIENT_STRINGS as _$,
  ITEM_NAME_REF_BY_TRANSLATED
} from '@/assets/data'
import { ModifierType } from './modifiers'
import { linesToStatStrings, tryParseTranslation, getRollOrMinmaxAvg } from './stat-translations'
import { ItemCategory } from './meta'
import { HeistJob, ParsedItem } from './ParsedItem'
import { magicBasetype } from './magic-name'
import { isModInfoLine, groupLinesByMod, parseModInfoLine, parseModType, ModifierInfo, ParsedModifier, sumStatsFromMods } from './advanced-mod-desc'

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
  parseMirrored,
  parseModifiers,
  parseModifiers,
  parseModifiers,
  { virtual: transformToLegacyModifiers }
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

  if (sections[0][2] === _$[C.CANNOT_USE_ITEM]) {
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

  if (item.category === ItemCategory.MetamorphSample) {
    if (_$[C.METAMORPH_BRAIN].test(item.name)) {
      item.name = 'Metamorph Brain'
    } else if (_$[C.METAMORPH_EYE].test(item.name)) {
      item.name = 'Metamorph Eye'
    } else if (_$[C.METAMORPH_LUNG].test(item.name)) {
      item.name = 'Metamorph Lung'
    } else if (_$[C.METAMORPH_HEART].test(item.name)) {
      item.name = 'Metamorph Heart'
    } else if (_$[C.METAMORPH_LIVER].test(item.name)) {
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
  if (section[0].startsWith(_$[C.TAG_MAP_TIER])) {
    item.props.mapTier = Number(section[0].substr(_$[C.TAG_MAP_TIER].length))

    let name = item.baseType || item.name
    if (_$[C.MAP_BLIGHTED].test(name)) {
      name = _$[C.MAP_BLIGHTED].exec(name)![1]
      name = ITEM_NAME_REF_BY_TRANSLATED.get(name) || name
      if (item.baseType) {
        item.baseType = name
      } else {
        item.name = name
      }
      item.category = ItemCategory.Map
      item.props.mapBlighted = true
    }

    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseNamePlate (section: string[]) {
  if (section.length < 3 ||
      !section[0].startsWith(_$[C.TAG_ITEM_CLASS]) ||
      !section[1].startsWith(_$[C.TAG_RARITY])) {
    return null
  }

  const rarityText = section[1].substr(_$[C.TAG_RARITY].length)
  let rarity: ItemRarity
  switch (rarityText) {
    case _$[ItemRarity.Currency]:
      rarity = ItemRarity.Currency
      break
    case _$[ItemRarity.DivinationCard]:
      rarity = ItemRarity.DivinationCard
      break
    case _$[ItemRarity.Gem]:
      rarity = ItemRarity.Gem
      break
    case _$[ItemRarity.Normal]:
      rarity = ItemRarity.Normal
      break
    case _$[ItemRarity.Magic]:
      rarity = ItemRarity.Magic
      break
    case _$[ItemRarity.Rare]:
      rarity = ItemRarity.Rare
      break
    case _$[ItemRarity.Unique]:
      rarity = ItemRarity.Unique
      break
    default:
      return null
  }

  const item: ParsedItem = {
    rarity,
    name: markupConditionParser(section[2]),
    baseType: (section.length >= 4) ? markupConditionParser(section[3]) : undefined,
    props: {},
    isUnidentified: false,
    isCorrupted: false,
    modifiers: [],
    newMods: [],
    unknownModifiers: [],
    influences: [],
    sockets: {},
    extra: {},
    rawText: undefined!
  }
  return item
}

function parseInfluence (section: string[], item: ParsedItem) {
  if (section.length <= 2) {
    const countBefore = item.influences.length

    for (const line of section) {
      switch (line) {
        case _$[C.CRUSADER_ITEM]:
          item.influences.push(ItemInfluence.Crusader)
          break
        case _$[C.ELDER_ITEM]:
          item.influences.push(ItemInfluence.Elder)
          break
        case _$[C.SHAPER_ITEM]:
          item.influences.push(ItemInfluence.Shaper)
          break
        case _$[C.HUNTER_ITEM]:
          item.influences.push(ItemInfluence.Hunter)
          break
        case _$[C.REDEEMER_ITEM]:
          item.influences.push(ItemInfluence.Redeemer)
          break
        case _$[C.WARLORD_ITEM]:
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
  if (section[0] === _$[C.CORRUPTED]) {
    item.isCorrupted = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseUnidentified (section: string[], item: ParsedItem) {
  if (section[0] === _$[C.UNIDENTIFIED]) {
    item.isUnidentified = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseItemLevel (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$[C.TAG_ITEM_LEVEL])) {
    item.itemLevel = Number(section[0].substr(_$[C.TAG_ITEM_LEVEL].length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseTalismanTier (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$[C.TAG_TALISMAN_TIER])) {
    item.props.talismanTier = Number(section[0].substr(_$[C.TAG_TALISMAN_TIER].length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseVaalGem (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Gem) return PARSER_SKIPPED

  if (section.length === 1) {
    let gemName: string | undefined
    if ((gemName = _$[C.QUALITY_ANOMALOUS].exec(section[0])?.[1])) {
      item.extra.altQuality = 'Anomalous'
    } else if ((gemName = _$[C.QUALITY_DIVERGENT].exec(section[0])?.[1])) {
      item.extra.altQuality = 'Divergent'
    } else if ((gemName = _$[C.QUALITY_PHANTASMAL].exec(section[0])?.[1])) {
      item.extra.altQuality = 'Phantasmal'
    } else if (_$[C.VAAL_GEM].test(section[0])) {
      gemName = section[0]
      item.extra.altQuality = 'Superior'
    }

    if (gemName) {
      item.name = ITEM_NAME_REF_BY_TRANSLATED.get(gemName) || gemName
      return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseGem (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Gem) {
    return PARSER_SKIPPED
  }
  if (section[1]?.startsWith(_$[C.TAG_GEM_LEVEL])) {
    // "Level: 20 (Max)"
    item.props.gemLevel = parseInt(section[1].substr(_$[C.TAG_GEM_LEVEL].length), 10)

    parseQualityNested(section, item)

    // don't override if parsed in Vaal name section
    if (!item.extra.altQuality) {
      let gemName: string | undefined
      if ((gemName = _$[C.QUALITY_ANOMALOUS].exec(item.name)?.[1])) {
        item.extra.altQuality = 'Anomalous'
      } else if ((gemName = _$[C.QUALITY_DIVERGENT].exec(item.name)?.[1])) {
        item.extra.altQuality = 'Divergent'
      } else if ((gemName = _$[C.QUALITY_PHANTASMAL].exec(item.name)?.[1])) {
        item.extra.altQuality = 'Phantasmal'
      } else {
        item.extra.altQuality = 'Superior'
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
  if (item.rarity !== ItemRarity.Currency && item.rarity !== ItemRarity.DivinationCard) {
    return PARSER_SKIPPED
  }
  if (section[0].startsWith(_$[C.TAG_STACK_SIZE])) {
    // Portal Scroll "Stack Size: 2[localized separator]448/40"
    const [value, max] = section[0].substr(_$[C.TAG_STACK_SIZE].length).replace(/[^\d/]/g, '').split('/').map(Number)
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
    const match = line.match(_$[C.SEED_MONSTER_LEVEL])
    if (match != null) {
      item.itemLevel = Number(match[1])
      break
    }
  }
}

function parseSockets (section: string[], item: ParsedItem) {
  if (section[0].startsWith(_$[C.TAG_SOCKETS])) {
    let sockets = section[0].substr(_$[C.TAG_SOCKETS].length).trimEnd()

    item.sockets.white = (sockets.split('W').length - 1)

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
    if (line.startsWith(_$[C.TAG_QUALITY])) {
      // "Quality: +20% (augmented)"
      item.quality = parseInt(line.substr(_$[C.TAG_QUALITY].length), 10)
      break
    }
  }
}

function parseArmour (section: string[], item: ParsedItem) {
  let isParsed = SECTION_SKIPPED as SectionParseResult

  for (const line of section) {
    if (line.startsWith(_$[C.TAG_ARMOUR])) {
      item.props.armour = parseInt(line.substr(_$[C.TAG_ARMOUR].length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_EVASION])) {
      item.props.evasion = parseInt(line.substr(_$[C.TAG_EVASION].length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_ENERGY_SHIELD])) {
      item.props.energyShield = parseInt(line.substr(_$[C.TAG_ENERGY_SHIELD].length), 10)
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_BLOCK_CHANCE])) {
      item.props.blockChance = parseInt(line.substr(_$[C.TAG_BLOCK_CHANCE].length), 10)
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
    if (line.startsWith(_$[C.TAG_CRIT_CHANCE])) {
      item.props.critChance = parseFloat(line.substr(_$[C.TAG_CRIT_CHANCE].length))
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_ATTACK_SPEED])) {
      item.props.attackSpeed = parseFloat(line.substr(_$[C.TAG_ATTACK_SPEED].length))
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_PHYSICAL_DAMAGE])) {
      item.props.physicalDamage = getRollOrMinmaxAvg(line
        .substr(_$[C.TAG_PHYSICAL_DAMAGE].length)
        .split('-').map(str => parseInt(str, 10))
      )
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_ELEMENTAL_DAMAGE])) {
      item.props.elementalDamage =
        line.substr(_$[C.TAG_ELEMENTAL_DAMAGE].length)
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

  if (!section.some(line =>
    line.endsWith(C.ENCHANT_LINE) ||
    isModInfoLine(line) ||
    (line === _$.VEILED_PREFIX || line === _$.VEILED_SUFFIX)
  )) {
    return SECTION_SKIPPED
  }

  if (section.some(line => line.endsWith(C.ENCHANT_LINE))) {
    const { lines } = parseModType(section)
    const modInfo: ModifierInfo = {
      type: ModifierType.Enchant,
      tags: []
    }
    parseStatsFromMod(lines, item, { info: modInfo, stats: [] })
  } else {
    section = section.filter(line => !parseVeiledNested(line, item))

    for (const { modLine, statLines } of groupLinesByMod(section)) {
      const { modType, lines } = parseModType(statLines)
      const modInfo = parseModInfoLine(modLine, modType)
      parseStatsFromMod(lines, item, { info: modInfo, stats: [] })
    }
  }

  return SECTION_PARSED
}

// TODO blocked by https://www.pathofexile.com/forum/view-thread/3148119
function parseVeiledNested (text: string, item: ParsedItem) {
  if (text === _$.VEILED_SUFFIX) {
    item.extra.veiled = (item.extra.veiled == null ? 'suffix' : 'prefix-suffix')
    return true
  }
  if (text === _$.VEILED_PREFIX) {
    item.extra.veiled = (item.extra.veiled == null ? 'prefix' : 'prefix-suffix')
    return true
  }
  return false
}

function parseMirrored (section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$[C.MIRRORED]) {
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
    if (_$[C.FLASK_CHARGES].test(line)) {
      return SECTION_PARSED
    }
  }

  return SECTION_SKIPPED
}

function parseSynthesised (section: string[], item: ParsedItem) {
  if (section.length === 1) {
    if (section[0] === _$[C.SECTION_SYNTHESISED]) {
      item.isSynthesised = true
      if (item.baseType) {
        item.baseType = _$[C.ITEM_SYNTHESISED].exec(item.baseType)![1]
      } else {
        item.name = _$[C.ITEM_SYNTHESISED].exec(item.name)![1]
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
    if (_$[C.ITEM_SUPERIOR].test(item.name)) {
      item.name = _$[C.ITEM_SUPERIOR].exec(item.name)![1]
    }
  }
}

function parseCategoryByHelpText (section: string[], item: ParsedItem) {
  if (section[0] === _$[C.PROPHECY_HELP]) {
    item.category = ItemCategory.Prophecy
    return SECTION_PARSED
  } else if (section[0] === _$[C.BEAST_HELP]) {
    item.category = ItemCategory.CapturedBeast
    return SECTION_PARSED
  } else if (section[0] === _$[C.METAMORPH_HELP]) {
    item.category = ItemCategory.MetamorphSample
    return SECTION_PARSED
  } else if (section[0].startsWith(_$[C.SEED_HELP])) {
    item.category = ItemCategory.Seed
    return SECTION_PARSED
  }

  return SECTION_SKIPPED
}

function parseProphecyMaster (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.Prophecy) return PARSER_SKIPPED

  if (section[0] === _$[C.PROPHECY_ALVA]) {
    item.extra.prophecyMaster = 'Alva'
    return SECTION_PARSED
  } else if (section[0] === _$[C.PROPHECY_EINHAR]) {
    item.extra.prophecyMaster = 'Einhar'
    return SECTION_PARSED
  } else if (section[0] === _$[C.PROPHECY_JUN]) {
    item.extra.prophecyMaster = 'Jun'
    return SECTION_PARSED
  } else if (section[0] === _$[C.PROPHECY_NIKO]) {
    item.extra.prophecyMaster = 'Niko'
    return SECTION_PARSED
  } else if (section[0] === _$[C.PROPHECY_ZANA]) {
    item.extra.prophecyMaster = 'Zana'
    return SECTION_PARSED
  }

  return SECTION_SKIPPED
}

function parseHeistMission (section: string[], item: ParsedItem) {
  if (item.category !== ItemCategory.HeistBlueprint &&
      item.category !== ItemCategory.HeistContract) return PARSER_SKIPPED

  for (const line of section) {
    if (line.startsWith(_$[C.TAG_AREA_LEVEL])) {
      item.props.areaLevel = Number(line.substr(_$[C.TAG_AREA_LEVEL].length))
      break
    }
  }
  if (!item.props.areaLevel) {
    return SECTION_SKIPPED
  }

  if (item.category === ItemCategory.HeistContract) {
    let match = null as RegExpMatchArray | null
    for (const line of section) {
      if ((match = line.match(_$[C.HEIST_JOB]))) {
        break
      }
    }
    if (!match) throw new Error('never')

    item.heistJob = {
      name: Object.entries(_$)
        .find(([_, tr]) => tr === match!.groups!.job)![0] as HeistJob,
      level: Number(match.groups!.level)
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

  item.newMods.push(modifier)

  item.unknownModifiers.push(...stat.value.map(line => ({
    text: line,
    type: modifier.info.type
  })))
}

/**
 * @deprecated
 */
function transformToLegacyModifiers (item: ParsedItem) {
  item.modifiers = sumStatsFromMods(item.newMods)
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
