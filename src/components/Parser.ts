import {
  ItemRarity,
  ItemInfluence,
  TAG_GEM_LEVEL,
  TAG_ITEM_LEVEL,
  TAG_MAP_TIER,
  TAG_RARITY,
  TAG_STACK_SIZE,
  TAG_SOCKETS,
  CORRUPTED,
  UNIDENTIFIED,
  SUFFIX_INFLUENCE
} from './parser-constants'

export {
  ItemRarity,
  ItemInfluence
}

export interface ParsedItem {
  rarity: ItemRarity
  name: string
  baseType: string | undefined
  itemLevel?: number
  mapTier?: number
  quality?: number
  linkedSockets?: number // only 5 or 6
  stackSize?: number
  isUnidentified: boolean
  isCorrupted: boolean
  gemLevel?: number
  influence: ItemInfluence // @TODO items can have second transfered influence type
  rawText: string
  computed: {
    type?: WellKnownType
    mapName?: string
    detailsId: string
  }
}

const LATEST_MAP_VARIANT = 'Metamorph'

enum WellKnownType {
  Map = 'Map',
  UniqueFlask = 'Unique Flask',
  MetamorphPart = 'Metamorph Part'
}

const SECTION_PARSED = 1
const SECTION_SKIPPED = 0
const PARSER_SKIPPED = -1

export function parseClipboard (clipboard: string) {
  const lines = clipboard.split(/\s*\n/)
  lines.pop()

  const sections: string[][] = [[]]
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

  const parsed = parseNamePlate(sections[0])
  if (!parsed) {
    return null
  }

  const parsers = new Set([
    parseUnidentified,
    parseItemLevel,
    parseGemLevel,
    parseStackSize,
    parseCorrupted,
    parseInfluence,
    parseMap,
    parseSockets,
    parseComputedInfo
  ])

  for (const section of sections) {
    for (const parser of parsers) {
      const result = parser(section, parsed)
      if (result === SECTION_PARSED) {
        parsers.delete(parser)
        break
      } else if (result === PARSER_SKIPPED) {
        parsers.delete(parser)
      }
    }
  }

  parsed.rawText = clipboard
  parsed.computed.detailsId = getDetailsId(parsed)

  return parsed
}

function parseComputedInfo (section: string[], item: ParsedItem) {
  if (item.computed.type == null) {
    // Map
    const mapName = (item.isUnidentified || item.rarity === ItemRarity.Normal)
      ? item.name
      : item.baseType

    if (mapName?.endsWith(' Map')) {
      item.computed.type = WellKnownType.Map
      item.computed.mapName = mapName
    }

    // Metamorph
    if (section[0] === `Combine this with four other different samples in Tane's Laboratory.`) {
      item.computed.type = WellKnownType.MetamorphPart
      return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseMap (section: string[], item: ParsedItem) {
  if (section[0].startsWith(TAG_MAP_TIER)) {
    item.mapTier = Number(section[0].substr(TAG_MAP_TIER.length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseNamePlate (section: string[]) {
  if (!section[0].startsWith(TAG_RARITY)) {
    return null
  }

  const rarity = section[0].substr(TAG_RARITY.length)
  switch (rarity) {
    case ItemRarity.Currency:
    case ItemRarity.DivinationCard:
    case ItemRarity.Gem:
    case ItemRarity.Normal:
    case ItemRarity.Magic:
    case ItemRarity.Rare:
    case ItemRarity.Unique:
      return {
        rarity,
        name: section[1].replace(/^(<<.*?>>|<.*?>)+/, ''), // Item from chat "<<set:MS>><<set:M>><<set:S>>Beast Grinder"
        baseType: section[2],
        isUnidentified: false,
        isCorrupted: false,
        influence: ItemInfluence.Normal,
        computed: {}
      } as ParsedItem
    default:
      return null
  }
}

function parseInfluence (section: string[], item: ParsedItem) {
  if (section[0].endsWith(SUFFIX_INFLUENCE)) {
    const influence = section[0].slice(0, -SUFFIX_INFLUENCE.length)
    switch (influence) {
      case ItemInfluence.Crusader:
      case ItemInfluence.Elder:
      case ItemInfluence.Shaper:
      case ItemInfluence.Hunter:
      case ItemInfluence.Redeemer:
      case ItemInfluence.Warlord:
        item.influence = influence
        return SECTION_PARSED
    }
  }
  return SECTION_SKIPPED
}

function parseCorrupted (section: string[], item: ParsedItem) {
  if (section[0] === CORRUPTED) {
    item.isCorrupted = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseUnidentified (section: string[], item: ParsedItem) {
  if (section[0] === UNIDENTIFIED) {
    item.isUnidentified = true
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseItemLevel (section: string[], item: ParsedItem) {
  if (section[0].startsWith(TAG_ITEM_LEVEL)) {
    item.itemLevel = Number(section[0].substr(TAG_ITEM_LEVEL.length))
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseGemLevel (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Gem) {
    return PARSER_SKIPPED
  }
  if (section[1]?.startsWith(TAG_GEM_LEVEL)) {
    // "Level: 20 (Max)"
    item.gemLevel = parseInt(section[1].substr(TAG_GEM_LEVEL.length), 10)
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseStackSize (section: string[], item: ParsedItem) {
  if (item.rarity !== ItemRarity.Currency && item.rarity !== ItemRarity.DivinationCard) {
    return PARSER_SKIPPED
  }
  if (section[0].startsWith(TAG_STACK_SIZE)) {
    // "Stack Size: 2/9"
    item.stackSize = parseInt(section[0].substr(TAG_STACK_SIZE.length), 10)
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

function parseSockets (section: string[], item: ParsedItem) {
  if (section[0].startsWith(TAG_SOCKETS)) {
    let sockets = section[0].substr(TAG_SOCKETS.length)
    sockets = sockets.replace(/[^ -]/g, '#')
    if (sockets === '#-#-#-#-#-#') {
      item.linkedSockets = 6
    } else if (
      sockets === '# #-#-#-#-#' ||
      sockets === '#-#-#-#-# #'
    ) {
      item.linkedSockets = 5
    }
    return SECTION_PARSED
  }
  return SECTION_SKIPPED
}

// detailsId

function getDetailsId (item: ParsedItem) {
  if (item.rarity === ItemRarity.Gem) {
    return getGemDetailsId(item)
  }

  if (item.computed.type === WellKnownType.Map) {
    return nameToDetailsId(`${item.computed.mapName} t${item.mapTier} ${LATEST_MAP_VARIANT}`)
  }

  if (item.rarity === ItemRarity.Unique) {
    if (item.baseType?.endsWith(' Flask')) {
      return nameToDetailsId(item.name)
    }
  }

  if (item.rarity === ItemRarity.Rare) {
    return getRareItemDetailsId(item)
  }

  return nameToDetailsId(item.baseType ? `${item.name} ${item.baseType}` : item.name)
}

function getGemDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(item.name)

  if (item.gemLevel! > 1) {
    id += `-${item.gemLevel}`
  }
  if (item.quality! > 0) {
    id += `-${item.quality}`
  }
  if (item.isCorrupted) {
    id += 'c'
  }

  return id
}

function getRareItemDetailsId (item: ParsedItem) {
  return nameToDetailsId(`${item.baseType || item.name} 82`)
}

function nameToDetailsId (name: string) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/'|,/g, '')
}
