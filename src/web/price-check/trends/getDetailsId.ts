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

const LATEST_MAP_VARIANT = 'Gen-12'

export function getDetailsId (item: ParsedItem) {
  if (item.category === ItemCategory.Gem) {
    return getGemDetailsId(item)!
  }
  if (item.category === ItemCategory.Map) {
    if (item.rarity === ItemRarity.Unique) {
      return nameToDetailsId(`${item.info.refName} t${item.mapTier}`)
    } else {
      return nameToDetailsId(`${item.mapBlighted ? `${item.mapBlighted} ` : ''}${item.info.refName} t${item.mapTier} ${LATEST_MAP_VARIANT}`)
    }
  }
  if (item.category === ItemCategory.CapturedBeast ||
      item.category === ItemCategory.MavenInvitation) {
    return nameToDetailsId(item.info.refName)
  }
  if (item.rarity === ItemRarity.Unique) {
    return getUniqueDetailsId(item)
  }
  if (isValuableBasetype(item)) {
    return getBaseTypeDetailsId(item)
  }
  if (item.info.prophecy?.masterName) {
    return nameToDetailsId(`${item.info.refName} ${item.info.prophecy.masterName}`)
  }
  if (item.category === ItemCategory.Seed) {
    return nameToDetailsId(`${item.info.refName} ${item.itemLevel! >= 76 ? '76' : '1-75'}`)
  }

  return nameToDetailsId(item.info.name)
}

const BRAND_RECALL_GEM = 'Brand Recall'
const BLOOD_AND_SAND_GEM = 'Blood and Sand'
const PORTAL_GEM = 'Portal'

function getGemDetailsId (item: ParsedItem) {
  if (item.info.refName === PORTAL_GEM) {
    return 'portal-1'
  }

  let id = item.gemAltQuality === 'Superior'
    ? nameToDetailsId(item.info.refName)
    : nameToDetailsId(`${item.gemAltQuality} ${item.info.refName}`)

  if (
    SPECIAL_SUPPORT_GEM.includes(item.info.refName) ||
    item.info.refName === BRAND_RECALL_GEM ||
    item.info.refName === BLOOD_AND_SAND_GEM ||
    item.gemLevel! >= 20
  ) {
    id += `-${item.gemLevel}`
  } else {
    id += '-1'
  }
  if (item.quality) {
    if (
      !SPECIAL_SUPPORT_GEM.includes(item.info.refName) &&
      !(item.info.refName === BRAND_RECALL_GEM && item.isCorrupted)
      // @TODO(poe.ninja blocking): !(item.info.refName === BLOOD_AND_SAND_GEM && item.isCorrupted)
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
  let id = nameToDetailsId(item.info.refName)

  id += `-${Math.min(item.itemLevel!, 86)}`

  if (item.influences.length === 1) {
    id += `-${item.influences[0].toLowerCase()}`
  } else if (item.influences.length > 1) {
    return undefined
  }

  return id
}

function getUniqueDetailsId (item: ParsedItem) {
  if (!item.info.unique) return

  let id = nameToDetailsId(`${item.info.refName}${getUniqueVariant(item) || ''} ${item.info.unique.base}`)

  if (item.sockets?.linked) {
    id += `-${item.sockets.linked}l`
  }
  if (item.info.unique.base === 'Ivory Watchstone') {
    const uses = item.statsByType.find(m => m.type === 'explicit' && m.stat.ref === '# uses remaining')!
    const roll = uses.sources[0].contributes!.value
    id += `-${roll}`
  }

  return id
}

function getUniqueVariant (item: ParsedItem) {
  function hasStat (item: ParsedItem, stat: string) {
    return item.statsByType.some(m => m.stat.ref === stat)
  }

  const uniqueName = item.info.refName

  if (uniqueName === 'Vessel of Vinktar') {
    if (hasStat(item, 'Adds # to # Lightning Damage to Attacks during Flask effect')) {
      return '-added-attacks'
    } else if (hasStat(item, 'Adds # to # Lightning Damage to Spells during Flask effect')) {
      return '-added-spells'
    } else if (hasStat(item, 'Damage Penetrates #% Lightning Resistance during Flask effect')) {
      return '-penetration'
    } else if (hasStat(item, '#% of Physical Damage Converted to Lightning during Flask effect')) {
      return '-conversion'
    }
  } else if (uniqueName === "Atziri's Splendour") {
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
  } else if (uniqueName === 'Bubonic Trail' || uniqueName === 'Lightpoacher' || uniqueName === 'Shroud of the Lightless' || uniqueName === 'Tombfist') {
    const sockets = item.statsByType.find(m => m.type === 'explicit' && m.stat.ref === 'Has # Abyssal Sockets')!
    const roll = sockets.sources[0].contributes!.value
    if (roll === 2) {
      return '-2-jewels'
    } else if (roll === 1) {
      return '-1-jewel'
    }
  } else if (uniqueName === "Volkuur's Guidance") {
    if (hasStat(item, 'Adds # to # Cold Damage to Spells and Attacks')) {
      return '-cold'
    } else if (hasStat(item, 'Adds # to # Fire Damage to Spells and Attacks')) {
      return '-fire'
    } else if (hasStat(item, 'Adds # to # Lightning Damage to Spells and Attacks')) {
      return '-lightning'
    }
  } else if (uniqueName === "Yriel's Fostering") {
    if (hasStat(item, 'Projectiles from Attacks have #% chance to Maim on Hit while\nyou have a Bestial Minion')) {
      return '-maim'
    } else if (hasStat(item, 'Projectiles from Attacks have #% chance to Poison on Hit while\nyou have a Bestial Minion')) {
      return '-poison'
    } else if (hasStat(item, 'Projectiles from Attacks have #% chance to inflict Bleeding on Hit while\nyou have a Bestial Minion')) {
      return '-bleeding'
    }
  } else if (uniqueName === "Doryani's Invitation") {
    if (hasStat(item, '#% increased Global Physical Damage')) {
      return '-physical'
    } else if (hasStat(item, '#% increased Fire Damage')) {
      return '-fire'
    } else if (hasStat(item, '#% increased Cold Damage')) {
      return '-cold'
    } else if (hasStat(item, '#% increased Lightning Damage')) {
      return '-lightning'
    }
  } else if (uniqueName === 'Impresence') {
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
  } else if (uniqueName === 'Voices') {
    const passives = item.statsByType.find(m => m.stat.ref === 'Adds # Small Passive Skills which grant nothing')!
    const roll = passives.sources[0].contributes!.value
    if (roll === 7) {
      return '-7-passives'
    } else if (roll === 5) {
      return '-5-passives'
    } else if (roll === 3) {
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
