import { ItemFilters } from './interface'
import { ParsedItem, ItemCategory, ItemRarity } from '../parser'

const TradeOpts = {
  GemLevel: 16,
  GemLevelRange: 0,
  GemQualityRange: 0
}

export const SPECIAL_SUPPORT_GEM = ['Empower Support', 'Enlighten Support', 'Enhance Support']

export function createFilters (item: ParsedItem): ItemFilters {
  if (item.rarity === ItemRarity.Gem) {
    return createGemFilters(item)
  }

  const filters: ItemFilters = {}

  if (item.computed.category === ItemCategory.ItemisedMonster) {
    filters.baseType = {
      value: item.baseType || item.name
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
  if (item.computed.category === ItemCategory.Prophecy) {
    filters.name = {
      value: item.name
    }
    filters.baseType = {
      value: 'Prophecy'
    }
    return filters
  }

  if (item.computed.category === ItemCategory.Map) {
    filters.baseType = {
      value: item.baseType || item.name
    }

    if (item.props.mapBlighted) {
      filters.mapBlighted = { value: true }
    }

    if (item.rarity === ItemRarity.Unique) {
      filters.rarity = {
        value: 'unique'
      }

      // NOTE:
      // 1 baseType = 1 Unique map. Now there is no need for this condition
      // if (!item.isUnidentified) {
      //   filters.name = { value: item.name }
      // }
    }

    filters.mapTier = {
      value: item.mapTier!
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
    if (item.computed.category) {
      filters.category = {
        value: item.computed.category
      }
    }
    // else { never? }
  } else {
    // @TODO
    filters.baseType = {
      value: item.baseType || item.name
    }
  }

  if (item.linkedSockets) {
    filters.linkedSockets = {
      value: item.linkedSockets,
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

  if (item.influences) {
    filters.influences = item.influences.map(influecne => ({
      value: influecne,
      disabled: true
    }))
  }

  if (item.itemLevel) {
    if (
      item.rarity !== ItemRarity.Unique &&
      item.computed.category !== ItemCategory.Map
      /* @TODO && !isJewel https://pathofexile.gamepedia.com/Jewel#Affixes */
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

  return filters
}

export function createGemFilters (item: ParsedItem) {
  const filters: ItemFilters = {}

  filters.baseType = {
    value: item.name
  }

  filters.corrupted = {
    value: item.isCorrupted
  }

  if (item.quality != null) {
    if (TradeOpts.GemQualityRange > 0) {
      filters.quality = {
        min: (item.quality || 0) - TradeOpts.GemQualityRange,
        max: (item.quality || 0) + TradeOpts.GemQualityRange
      }
    } else {
      filters.quality = {
        min: item.quality
      }
    }
  }

  if (SPECIAL_SUPPORT_GEM.includes(item.name)) {
    filters.gemLevel = {
      min: item.gemLevel,
      max: item.gemLevel
    }
  } else if (item.gemLevel! >= TradeOpts.GemLevel) {
    if (TradeOpts.GemLevelRange > 0) {
      filters.gemLevel = {
        min: item.gemLevel! - TradeOpts.GemLevelRange,
        max: item.gemLevel! + TradeOpts.GemLevelRange
      }
    } else {
      filters.gemLevel = {
        min: item.gemLevel
      }
    }
  }

  return filters
}
