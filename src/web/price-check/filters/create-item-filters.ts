import { ItemFilters } from './interfaces'
import { ParsedItem, ItemCategory, ItemRarity } from '@/parser'
import { VEILED_STAT } from './veiled'
import { selected as league } from '@/web/background/Leagues'
import { tradeTag } from '../trade/common'
import { Config } from '@/web/Config'
import { PriceCheckWidget } from '@/web/overlay/interfaces'

export const SPECIAL_SUPPORT_GEM = ['Empower Support', 'Enlighten Support', 'Enhance Support']

export function createFilters (item: ParsedItem): ItemFilters {
  const cfg = Config.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget

  const filters: ItemFilters = {
    trade: {
      offline: false,
      listed: undefined,
      league: league.value!
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
  if (item.stackSize || tradeTag(item)) {
    filters.stackSize = {
      value: item.stackSize?.value || 1,
      disabled: !(item.stackSize && item.stackSize.value > 1 && cfg.activateStockFilter)
    }
  }
  if (item.category === ItemCategory.MavenInvitation) {
    filters.baseType = {
      value: item.baseType || item.name
    }
    return filters
  }
  if (
    item.category === ItemCategory.MetamorphSample ||
    item.category === ItemCategory.Seed
  ) {
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
    if (item.extra.prophecyMaster) {
      filters.discriminator = {
        value: item.extra.prophecyMaster
      }
    }
    return filters
  }

  if (item.category === ItemCategory.Map) {
    if (item.modifiers.some(mod => mod.stat.ref === 'Map is occupied by #')) {
      filters.category = {
        value: item.category
      }
    } else {
      filters.baseType = {
        value: item.baseType || item.name
      }
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
  } else if (
    item.category === ItemCategory.HeistContract ||
    item.category === ItemCategory.HeistBlueprint
  ) {
    if (item.rarity === ItemRarity.Unique) {
      filters.name = { value: item.name }
      filters.baseType = { value: item.baseType! }
    } else {
      filters.category = {
        value: item.category
      }

      filters.areaLevel = {
        value: item.props.areaLevel!
      }

      if (item.heistJob) {
        filters.heistJob = {
          name: item.heistJob.name,
          level: item.heistJob.level
        }
      }
    }
  } else if (
    item.category === ItemCategory.ClusterJewel &&
    item.rarity !== ItemRarity.Unique
  ) {
    filters.baseType = {
      value: item.baseType || item.name
    }
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

  if (item.isMirrored) {
    filters.mirrored = {
      value: true
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
      item.category !== ItemCategory.Jewel && /* https://pathofexile.gamepedia.com/Jewel#Affixes */
      item.category !== ItemCategory.HeistBlueprint &&
      item.category !== ItemCategory.HeistContract
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

    if (item.rarity === ItemRarity.Unique) {
      if (item.isUnidentified && item.name === "Watcher's Eye") {
        filters.itemLevel = {
          value: item.itemLevel,
          disabled: false
        }
      }

      if (item.itemLevel >= 75 && [
        'Agnerod', 'Agnerod East', 'Agnerod North', 'Agnerod South', 'Agnerod West'
      ].includes(item.name)) {
        // https://pathofexile.gamepedia.com/The_Vinktar_Square
        const normalizedLvl =
          item.itemLevel >= 82 ? 82
            : item.itemLevel >= 80 ? 80
              : item.itemLevel >= 78 ? 78
                : 75

        filters.itemLevel = {
          value: normalizedLvl,
          disabled: false
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

  if (item.extra.veiled) {
    filters.veiled = {
      stat: VEILED_STAT.filter(s => s.test(item))[0].stat,
      disabled: false
    }

    if (item.rarity !== ItemRarity.Unique) {
      if (filters.itemLevel) {
        filters.itemLevel.disabled = false
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

  filters.altQuality = {
    value: item.extra.altQuality!,
    disabled: false
  }

  return filters
}
