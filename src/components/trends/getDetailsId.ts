import { ParsedItem, ItemRarity, ItemCategory } from '../parser'
import { SPECIAL_SUPPORT_GEM } from '../filters/create-item-filters'
import { ACCESSORY, ARMOUR, WEAPON } from '../parser/meta'

export function isValuableBasetype (item: ParsedItem): boolean {
  if (
    !(item.rarity === ItemRarity.Normal || item.rarity === ItemRarity.Magic || item.rarity === ItemRarity.Rare) ||
    !item.category
  ) return false

  return (
    ACCESSORY.has(item.category) ||
    ARMOUR.has(item.category) ||
    WEAPON.has(item.category) ||
    item.category === ItemCategory.Quiver
  )
}

const LATEST_MAP_VARIANT = 'Metamorph'

export function getDetailsId (item: ParsedItem) {
  if (item.rarity === ItemRarity.Gem) {
    return getGemDetailsId(item)!
  }
  if (item.category === ItemCategory.Map) {
    if (item.rarity === ItemRarity.Unique) {
      // @TODO if unidentified get name by baseType
      return nameToDetailsId(`${item.name} t${item.props.mapTier}`)
    } else {
      return nameToDetailsId(`${item.props.mapBlighted ? 'Blighted ' : ''}${item.baseType || item.name} t${item.props.mapTier} ${LATEST_MAP_VARIANT}`)
    }
  }
  if (item.category === ItemCategory.ItemisedMonster) {
    return nameToDetailsId(item.baseType || item.name)
  }
  if (item.rarity === ItemRarity.Unique) {
    return getUniqueDetailsId(item)
  }
  if (isValuableBasetype(item)) {
    return getBaseTypeDetailsId(item)
  }

  return nameToDetailsId(item.baseType ? `${item.name} ${item.baseType}` : item.name)
}

const BRAND_RECALL_GEM = 'Brand Recall'
const BLOOD_AND_SAND_GEM = 'Blood and Sand'
const PORTAL_GEM = 'Portal'

function getGemDetailsId (item: ParsedItem) {
  if (item.name === PORTAL_GEM) {
    return 'portal-1'
  }
  if (item.name.startsWith('Awakened')) {
    return (item.props.gemLevel === 1)
      ? `${nameToDetailsId(item.name)}-1-20`
      : undefined
  }

  let id = nameToDetailsId(item.name)

  if (
    SPECIAL_SUPPORT_GEM.includes(item.name) ||
    item.name === BRAND_RECALL_GEM ||
    item.name === BLOOD_AND_SAND_GEM ||
    item.props.gemLevel! >= 20
  ) {
    id += `-${item.props.gemLevel}`
  }
  if (item.quality) {
    if (
      !SPECIAL_SUPPORT_GEM.includes(item.name) &&
      !(item.name === BRAND_RECALL_GEM && item.isCorrupted)
      // @TODO(poe.ninja blocking): !(item.name === BLOOD_AND_SAND_GEM && item.isCorrupted)
    ) {
      // Gem Q20 with up to 4xGCP (TODO: should this rule apply to corrupted gems?)
      const q = (item.quality >= 16 && item.quality <= 20) ? 20 : item.quality
      id += `-${q}`
    }
  }
  if (item.isCorrupted) {
    id += 'c'
  }

  return id
}

function getBaseTypeDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(`${item.baseType || item.name}`)

  id += `-${Math.min(item.itemLevel!, 86)}`

  if (item.influences.length === 1) {
    id += `-${item.influences[0].toLowerCase()}`
  }

  return id
}

function getUniqueDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(`${item.name} ${item.baseType}`)

  if (item.sockets.linked) {
    id += `-${item.sockets.linked}l`
  }

  return id
}

export function nameToDetailsId (name: string) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/'|,/g, '')
}
