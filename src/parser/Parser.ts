import { ItemRarity, ItemInfluence } from './constants'
import * as C from './constants'
import {
  BASE_TYPES,
  CLIENT_STRINGS as _$,
  ITEM_NAME_REF_BY_TRANSLATED
} from '@/assets/data'
import { ModifierType, sectionToStatStrings, tryFindModifier } from './modifiers'
import { ItemCategory } from './meta'
import { ParsedItem } from './ParsedItem'
import { magicBasetype } from './magic-name'
import { getRollAsSingleNumber } from './utils'

const SECTION_PARSED = 1
const SECTION_SKIPPED = 0
const PARSER_SKIPPED = -1

type SectionParseResult =
  typeof SECTION_PARSED |
  typeof SECTION_SKIPPED |
  typeof PARSER_SKIPPED

interface ParserFn {
  (section: string[], item: ParsedItem): SectionParseResult
}

const parsers: ParserFn[] = [
  parseUnidentified,
  parseSynthesised,
  parseCategoryByHelpText,
  normalizeName,
  // -----------
  parseItemLevel,
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
  parseModifiers,
  parseModifiers,
  parseModifiers
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

  const parsed = parseNamePlate(sections[0])
  if (!parsed) {
    return null
  }
  sections.shift()

  // each section can be parsed at most by one parser
  for (const parser of parsers) {
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

  parsed.rawText = clipboard

  return Object.freeze(parsed)
}

function normalizeName (_: string[], item: ParsedItem) {
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

  return PARSER_SKIPPED as SectionParseResult // fake parser
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
  if (!section[0].startsWith(_$[C.TAG_RARITY])) {
    return null
  }

  const rarityText = section[0].substr(_$[C.TAG_RARITY].length)
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
    name: section[1].replace(/^(<<.*?>>|<.*?>)+/, ''), // Item from chat "<<set:MS>><<set:M>><<set:S>>Beast Grinder"
    baseType: section[2]?.replace(/^(<<.*?>>|<.*?>)+/, ''),
    props: {},
    isUnidentified: false,
    isCorrupted: false,
    modifiers: [],
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

function parseVaalGem (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Gem) return PARSER_SKIPPED

  if (section.length === 1) {
    if (_$[C.VAAL_GEM].test(section[0])) {
      const name = section[0]
      item.name = ITEM_NAME_REF_BY_TRANSLATED.get(name) || name
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

    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseStackSize (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Currency && item.rarity !== ItemRarity.DivinationCard) {
    return PARSER_SKIPPED
  }
  if (section[0].startsWith(_$[C.TAG_STACK_SIZE])) {
    // "Stack Size: 2/9"
    const [value, max] = section[0].substr(_$[C.TAG_STACK_SIZE].length).split('/').map(Number)
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
      item.props.physicalDamage = (
        line.substr(_$[C.TAG_PHYSICAL_DAMAGE].length)
          .split('-').map(str => parseInt(str, 10))
      )
      isParsed = SECTION_PARSED; continue
    }
    if (line.startsWith(_$[C.TAG_ELEMENTAL_DAMAGE])) {
      item.props.elementalDamage =
        line.substr(_$[C.TAG_ELEMENTAL_DAMAGE].length)
          .split(', ')
          .map(element => getRollAsSingleNumber(element.split('-').map(str => parseInt(str, 10))))
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

  const countBefore = item.modifiers.length

  const statIterator = sectionToStatStrings(section)
  let stat = statIterator.next()
  while (!stat.done) {
    if (parseVeiledNested(stat.value, item)) {
      stat = statIterator.next(true)
      continue
    }

    let modType: ModifierType | undefined

    // cleanup suffix
    if (stat.value.endsWith(C.IMPLICIT_SUFFIX)) {
      stat.value = stat.value.slice(0, -C.IMPLICIT_SUFFIX.length)
      modType = ModifierType.Implicit
    } else if (stat.value.endsWith(C.CRAFTED_SUFFIX)) {
      stat.value = stat.value.slice(0, -C.CRAFTED_SUFFIX.length)
      modType = ModifierType.Crafted
    } else if (stat.value.endsWith(C.ENCHANT_SUFFIX)) {
      stat.value = stat.value.slice(0, -C.ENCHANT_SUFFIX.length)
      modType = ModifierType.Enchant
    }

    const mod = tryFindModifier(stat.value)
    if (mod) {
      if (modType == null) {
        const isExplicit = mod.stat.types.find(type =>
          type.name === ModifierType.Explicit
        )
        if (isExplicit) {
          modType = ModifierType.Explicit
        }
      }

      if (mod.stat.types.find(type => type.name === modType)) {
        mod.type = modType!
        item.modifiers.push(mod)
        stat = statIterator.next(true)
      } else {
        stat = statIterator.next(false)
      }
    } else {
      stat = statIterator.next(false)
    }
  }

  if (countBefore < item.modifiers.length) {
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseVeiledNested (text: string, item: ParsedItem) {
  if (text === _$[C.VEILED_SUFFIX]) {
    item.extra.veiled = (item.extra.veiled == null ? 'suffix' : 'prefix-suffix')
    return true
  }
  if (text === _$[C.VEILED_PREFIX]) {
    item.extra.veiled = (item.extra.veiled == null ? 'prefix' : 'prefix-suffix')
    return true
  }
  return false
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
