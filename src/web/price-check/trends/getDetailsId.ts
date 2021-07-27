import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { SPECIAL_SUPPORT_GEM } from '../filters/create-item-filters'
import { ACCESSORY, ARMOUR, WEAPON } from '@/parser/meta'

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

const LATEST_MAP_VARIANT = 'Gen-11'

export function getDetailsId (item: ParsedItem) {
  if (item.rarity === ItemRarity.Gem) {
    return getGemDetailsId(item)!
  }
  if (item.category === ItemCategory.Map) {
    if (item.rarity === ItemRarity.Unique) {
      return nameToDetailsId(`${item.name} t${item.props.mapTier}`)
    } else {
      return nameToDetailsId(`${item.props.mapBlighted ? 'Blighted ' : ''}${item.baseType || item.name} t${item.props.mapTier} ${LATEST_MAP_VARIANT}`)
    }
  }
  if (item.category === ItemCategory.CapturedBeast ||
      item.category === ItemCategory.MavenInvitation) {
    return nameToDetailsId(item.baseType || item.name)
  }
  if (item.rarity === ItemRarity.Unique) {
    return getUniqueDetailsId(item)
  }
  if (isValuableBasetype(item)) {
    return getBaseTypeDetailsId(item)
  }
  if (item.extra.prophecyMaster) {
    return nameToDetailsId(`${item.name} ${item.extra.prophecyMaster}`)
  }
  if (item.category === ItemCategory.Seed) {
    return nameToDetailsId(`${item.name} ${item.itemLevel! >= 76 ? '76' : '1-75'}`)
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

  let id = item.extra.altQuality === 'Superior'
    ? nameToDetailsId(item.name)
    : nameToDetailsId(`${item.extra.altQuality} ${item.name}`)

  if (
    SPECIAL_SUPPORT_GEM.includes(item.name) ||
    item.name === BRAND_RECALL_GEM ||
    item.name === BLOOD_AND_SAND_GEM ||
    item.props.gemLevel! >= 20
  ) {
    id += `-${item.props.gemLevel}`
  } else {
    id += '-1'
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
  } else if (item.influences.length > 1) {
    return undefined
  }

  return id
}

function getUniqueDetailsId (item: ParsedItem) {
  let id = nameToDetailsId(`${item.name}${getUniqueVariant(item) || ''} ${item.baseType}`)

  if (item.sockets.linked) {
    id += `-${item.sockets.linked}l`
  }
  if (item.baseType === 'Ivory Watchstone') {
    const uses = item.modifiers.find(m => m.type === 'explicit' && m.stat.ref === '# uses remaining')!.value
    id += `-${uses}`
  }

  return id
}

function getUniqueVariant (item: ParsedItem) {
  function hasStat (item: ParsedItem, stat: string) {
    return item.modifiers.some(m => m.stat.ref === stat)
  }

  if (item.name === 'Vessel of Vinktar') {
    if (hasStat(item, 'Adds # to # Lightning Damage to Attacks during Flask effect')) {
      return '-added-attacks'
    } else if (hasStat(item, 'Adds # to # Lightning Damage to Spells during Flask effect')) {
      return '-added-spells'
    } else if (hasStat(item, 'Damage Penetrates #% Lightning Resistance during Flask effect')) {
      return '-penetration'
    } else if (hasStat(item, '#% of Physical Damage Converted to Lightning during Flask effect')) {
      return '-conversion'
    }
  } else if (item.name === "Atziri's Splendour") {
    if (hasStat(item, '#% increased Armour, Evasion and Energy Shield')) {
      return '-armour-evasion-es'
    } else if (hasStat(item, '#% increased Evasion and Energy Shield') && hasStat(item, '+# to maximum Energy Shield')) {
      return '-evasion-es'
    } else if (hasStat(item, '#% increased Evasion and Energy Shield') && hasStat(item, '+# to maximum Life')) {
      return '-evasion-es-life'
    } else if (hasStat(item, '#% increased Armour and Energy Shield') && hasStat(item, '+# to maximum Energy Shield')) {
      return '-armour-es'
    } else if (hasStat(item, '#% increased Armour and Energy Shield') && hasStat(item, '+# to maximum Life')) {
      return '-armour-es-life'
    } else if (hasStat(item, '#% increased Armour and Evasion') && hasStat(item, '+# to maximum Life')) {
      return '-armour-evasion'
    } else if (hasStat(item, '+# to maximum Energy Shield') && hasStat(item, '#% increased Energy Shield')) {
      return '-es'
    } else if (hasStat(item, '#% increased Evasion Rating') && hasStat(item, '+# to maximum Life')) {
      return '-evasion'
    } else if (hasStat(item, '#% increased Armour') && hasStat(item, '+# to maximum Life')) {
      return '-armour'
    }
  } else if (item.name === 'Bubonic Trail' || item.name === 'Lightpoacher' || item.name === 'Shroud of the Lightless' || item.name === 'Tombfist') {
    const sockets = item.modifiers.find(m => m.type === 'explicit' && m.stat.ref === 'Has # Abyssal Sockets')!
    if (sockets.value === 2) {
      return '-2-jewels'
    } else if (sockets.value === 1) {
      return '-1-jewel'
    }
  } else if (item.name === "Volkuur's Guidance") {
    if (hasStat(item, 'Adds # to # Cold Damage to Spells and Attacks')) {
      return '-cold'
    } else if (hasStat(item, 'Adds # to # Fire Damage to Spells and Attacks')) {
      return '-fire'
    } else if (hasStat(item, 'Adds # to # Lightning Damage to Spells and Attacks')) {
      return '-lightning'
    }
  } else if (item.name === "Yriel's Fostering") {
    if (hasStat(item, 'Projectiles from Attacks have #% chance to Maim on Hit while\nyou have a Bestial Minion')) {
      return '-maim'
    } else if (hasStat(item, 'Projectiles from Attacks have #% chance to Poison on Hit while\nyou have a Bestial Minion')) {
      return '-poison'
    } else if (hasStat(item, 'Projectiles from Attacks have #% chance to inflict Bleeding on Hit while\nyou have a Bestial Minion')) {
      return '-bleeding'
    }
  } else if (item.name === "Doryani's Invitation") {
    if (hasStat(item, '#% increased Global Physical Damage')) {
      return '-physical'
    } else if (hasStat(item, '#% increased Fire Damage')) {
      return '-fire'
    } else if (hasStat(item, '#% increased Cold Damage')) {
      return '-cold'
    } else if (hasStat(item, '#% increased Lightning Damage')) {
      return '-lightning'
    }
  } else if (item.name === 'Impresence') {
    if (hasStat(item, 'Adds # to # Cold Damage')) {
      return '-cold'
    } else if (hasStat(item, 'Adds # to # Chaos Damage')) {
      return '-chaos'
    } else if (hasStat(item, 'Adds # to # Fire Damage')) {
      return '-fire'
    } else if (hasStat(item, 'Adds # to # Lightning Damage')) {
      return '-lightning'
    } else if (hasStat(item, 'Adds # to # Physical Damage')) {
      return '-physical'
    }
  } else if (item.name === 'Voices') {
    const passives = item.modifiers.find(m => m.stat.ref === 'Adds # Small Passive Skills which grant nothing')!

    if (passives.value === 7) {
      return '-7-passives'
    } else if (passives.value === 5) {
      return '-5-passives'
    } else if (passives.value === 3) {
      return '-3-passives'
    }
  }
}

export function nameToDetailsId (name: string) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/'|,/g, '')
}
