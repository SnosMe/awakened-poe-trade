import { ParsedItem, ItemRarity, ItemCategory } from '../Parser'
import { SPECIAL_SUPPORT_GEM } from '../pathofexile-trade'

const LATEST_MAP_VARIANT = 'Metamorph'

export function getDetailsId (item: ParsedItem) {
  if (item.rarity === ItemRarity.Gem) {
    return getGemDetailsId(item)
  }
  if (item.computed.category === ItemCategory.Map) {
    if (item.rarity === ItemRarity.Unique) {
      // @TODO if unidentified get name by baseType
      return nameToDetailsId(`${item.name} t${item.mapTier}`)
    } else {
      return nameToDetailsId(`${item.computed.mapName} t${item.mapTier} ${LATEST_MAP_VARIANT}`)
    }
  }
  if (item.rarity === ItemRarity.Unique) {
    return getUniqueDetailsId(item)
  }

  return nameToDetailsId(item.baseType ? `${item.name} ${item.baseType}` : item.name)
}

function getGemDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(item.name)

  if (item.gemLevel! > 1) {
    id += `-${item.gemLevel}`
  }
  if (item.quality! > 0 && !SPECIAL_SUPPORT_GEM.includes(item.name)) {
    id += `-${item.quality}`
  }
  if (item.isCorrupted) {
    id += 'c'
  }

  return id
}

function getBaseTypeDetailsId (item: ParsedItem) {
  return nameToDetailsId(`${item.baseType || item.name} 82`)
}

function getUniqueDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(`${item.name} ${item.baseType}`)

  if (item.linkedSockets) {
    id += `-${item.linkedSockets}l`
  }

  return id
}

export function nameToDetailsId (name: string) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/'|,/g, '')
}
