import { ItemFilters } from './interfaces'
import { ParsedItem, ItemCategory, ItemRarity } from '@/parser'
import { Leagues } from '../Leagues'

export const SPECIAL_SUPPORT_GEM = ['Empower Support', 'Enlighten Support', 'Enhance Support']

export function createFilters (item: ParsedItem): ItemFilters {
  const filters: ItemFilters = {
    trade: {
      offline: false,
      listed: undefined,
      league: Leagues.selected!
    }
  }

  if (item.rarity === ItemRarity.Gem) {
    return createGemFilters(item, filters)
  }
  if (item.category === ItemCategory.CapturedBeast) {
    filters.baseType = {
      value: item.baseType || item.name
    }
    return filters
  }
  if (item.category === ItemCategory.MetamorphSample) {
    filters.baseType = {
      value: item.name
    }
    filters.itemLevel = {
      value: item.itemLevel!,
      disabled: false
    }
    return filters
  }
  if (
    item.rarity === ItemRarity.DivinationCard ||
    item.rarity === ItemRarity.Currency
  ) {
    filters.baseType = {
      value: item.name
    }
    return filters
  }
  if (item.category === ItemCategory.Prophecy) {
    filters.name = {
      value: item.name
    }
    filters.baseType = {
      value: 'Prophecy'
    }
    return filters
  }

  if (item.category === ItemCategory.Map) {
    filters.baseType = {
      value: item.baseType || item.name
    }

    if (item.props.mapBlighted) {
      filters.mapBlighted = { value: true }
    }

    if (item.rarity === ItemRarity.Unique) {
      filters.name = { value: item.name }
    }

    filters.mapTier = {
      value: item.props.mapTier!
    }

    // @TODO: juicy corrupted maps
  } else if (item.rarity === ItemRarity.Unique) {
    filters.name = {
      value: item.name
    }
    filters.baseType = {
      value: item.baseType!
    }
  } else if (item.rarity === ItemRarity.Rare) {
    if (item.category) {
      filters.category = {
        value: item.category
      }
    }
    // else { never? }
  } else {
    // @TODO
    filters.baseType = {
      value: item.baseType || item.name
    }
  }

  if (item.sockets.linked) {
    filters.linkedSockets = {
      value: item.sockets.linked,
      disabled: false
    }
  }

  if (item.sockets.white) {
    filters.whiteSockets = {
      value: item.sockets.white,
      disabled: false
    }
  }

  if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare ||
    item.rarity === ItemRarity.Unique
  ) {
    filters.corrupted = {
      value: item.isCorrupted
    }
  }

  if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare
  ) {
    filters.rarity = {
      value: 'nonunique'
    }
  }

  if (item.influences.length) {
    filters.influences = item.influences.map(influecne => ({
      value: influecne,
      disabled: true
    }))
  }

  if (item.itemLevel) {
    if (
      item.rarity !== ItemRarity.Unique &&
      item.category !== ItemCategory.Map &&
      item.category !== ItemCategory.Jewel /* https://pathofexile.gamepedia.com/Jewel#Affixes */
    ) {
      if (item.itemLevel > 86) {
        filters.itemLevel = {
          value: 86,
          disabled: true
        }
        // @TODO limit by item type
        // If (RegExMatch(subtype, "i)Helmet|Gloves|Boots|Body Armour|Shield|Quiver")) {
        //   Return (iLvl >= 84) ? 84 : false
        // }
        // Else If (RegExMatch(subtype, "i)Weapon")) {
        //   Return (iLvl >= 83) ? 83 : false
        // }
        // Else If (RegExMatch(subtype, "i)Belt|Amulet|Ring")) {
        //   Return (iLvl >= 83) ? 83 : false
        // }
        // Return false
      } else {
        filters.itemLevel = {
          value: item.itemLevel,
          disabled: true
        }
      }
    }
  }

  if (item.isUnidentified) {
    filters.unidentified = {
      value: true,
      disabled: (item.rarity !== ItemRarity.Unique)
    }

    if (item.rarity !== ItemRarity.Unique) {
      if (filters.itemLevel) {
        filters.itemLevel.disabled = false
      }
      if (filters.influences) {
        filters.influences[0].disabled = false
      }
      filters.category = undefined
      filters.baseType = {
        value: item.baseType || item.name
      }
    }
  }

  return filters
}

function createGemFilters (item: ParsedItem, filters: ItemFilters) {
  filters.baseType = {
    value: item.name
  }

  filters.corrupted = {
    value: item.isCorrupted
  }

  if (item.quality) {
    filters.quality = {
      value: item.quality,
      disabled: false
    }
  }

  if (SPECIAL_SUPPORT_GEM.includes(item.name)) {
    filters.gemLevel = {
      min: item.props.gemLevel!,
      max: item.props.gemLevel!,
      disabled: false
    }
  } else {
    filters.gemLevel = {
      min: item.props.gemLevel!,
      disabled: item.props.gemLevel! < 16
    }
  }

  return filters
}
