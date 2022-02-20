import type { ItemFilters } from './interfaces'
import { ParsedItem, ItemCategory, ItemRarity } from '@/parser'
import { tradeTag, PERMANENT_LEAGUES } from '../trade/common'
import { ModifierType } from '@/parser/modifiers'
import { ITEM_BY_REF } from '@/assets/data'
import { CATEGORY_TO_TRADE_ID } from '../trade/pathofexile-trade'

export const SPECIAL_SUPPORT_GEM = ['Empower Support', 'Enlighten Support', 'Enhance Support']

export function createFilters (
  item: ParsedItem,
  opts: {
    league: string
    chaosPriceThreshold: number
    collapseListings: 'app' | 'api'
    activateStockFilter: boolean
  }
): ItemFilters {
  const filters: ItemFilters = {
    searchExact: {},
    trade: {
      offline: false,
      onlineInLeague: PERMANENT_LEAGUES.includes(opts.league),
      listed: undefined,
      league: opts.league,
      chaosPriceThreshold: opts.chaosPriceThreshold,
      collapseListings: opts.collapseListings
    }
  }

  if (item.category === ItemCategory.Gem) {
    return createGemFilters(item, filters)
  }
  if (item.category === ItemCategory.CapturedBeast) {
    filters.searchExact = {
      baseType: item.info.refName,
      baseTypeTrade: item.info.refName
    }
    return filters
  }
  if (item.stackSize || tradeTag(item)) {
    filters.stackSize = {
      value: item.stackSize?.value || 1,
      disabled: !(item.stackSize && item.stackSize.value > 1 && opts.activateStockFilter)
    }
  }
  if (item.category === ItemCategory.Invitation) {
    filters.searchExact = {
      baseType: item.info.refName
    }
    return filters
  }
  if (item.category === ItemCategory.MetamorphSample) {
    filters.searchExact = {
      baseType: item.info.refName
    }
    filters.itemLevel = {
      value: item.itemLevel!,
      disabled: false
    }
    return filters
  }
  if (
    item.category === ItemCategory.DivinationCard ||
    item.category === ItemCategory.Currency
  ) {
    filters.searchExact = {
      baseType: item.info.refName
    }
    if (item.info.refName === 'Chronicle of Atzoatl') {
      filters.areaLevel = {
        value: floorToBracket(item.areaLevel!, [1, 68, 73, 75, 78, 80]),
        disabled: false
      }
    }
    return filters
  }

  if (item.category === ItemCategory.Map) {
    if (item.rarity === ItemRarity.Unique && item.info.unique) {
      filters.searchExact = {
        name: item.info.name,
        baseType: ITEM_BY_REF('ITEM', item.info.unique.base)![0].name
      }
    } else {
      const isOccupiedBy = item.statsByType.some(calc => calc.stat.ref === 'Map is occupied by #')
      filters.searchExact = {
        baseType: item.info.refName
      }
      filters.searchRelaxed = {
        category: item.category,
        disabled: !isOccupiedBy
      }
    }

    if (item.mapBlighted) {
      filters.mapBlighted = { value: item.mapBlighted }
    }

    filters.mapTier = {
      value: item.mapTier!,
      disabled: false
    }
  } else if (item.category === ItemCategory.HeistContract) {
    filters.searchExact = {
      baseType: item.info.refName
    }
  } else if (item.category === ItemCategory.HeistBlueprint) {
    filters.searchRelaxed = {
      category: item.category,
      disabled: true // TODO: blocked by https://www.pathofexile.com/forum/view-thread/3109852
    }
    filters.searchExact = {
      baseType: item.info.refName
    }

    filters.areaLevel = {
      value: item.areaLevel!,
      disabled: false
    }

    if (item.heist?.wingsRevealed && item.heist.wingsRevealed > 1) {
      filters.heistWingsRevealed = {
        value: item.heist.wingsRevealed,
        disabled: false
      }
    }
  } else if (
    item.category === ItemCategory.ClusterJewel &&
    item.rarity !== ItemRarity.Unique
  ) {
    filters.searchExact = {
      baseType: item.info.refName
    }
    filters.searchRelaxed = {
      category: item.category,
      disabled: true
    }
  } else if (item.rarity === ItemRarity.Unique && item.info.unique) {
    filters.searchExact = {
      name: item.info.name,
      baseType: ITEM_BY_REF('ITEM', item.info.unique.base)![0].refName
    }
  } else {
    filters.searchExact = {
      baseType: item.info.refName
    }
    if (item.category && CATEGORY_TO_TRADE_ID.has(item.category)) {
      filters.searchRelaxed = {
        category: item.category,
        disabled: (item.rarity !== ItemRarity.Rare)
      }
    }
  }

  if (item.sockets?.linked) {
    filters.linkedSockets = {
      value: item.sockets.linked,
      disabled: false
    }
  }

  if (item.sockets?.white) {
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
    filters.mirrored = { disabled: false }
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
      if (item.isUnidentified && item.info.refName === "Watcher's Eye") {
        filters.itemLevel = {
          value: item.itemLevel,
          disabled: false
        }
      }

      if (item.itemLevel >= 75 && [
        'Agnerod', 'Agnerod East', 'Agnerod North', 'Agnerod South', 'Agnerod West'
      ].includes(item.info.refName)) {
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
      if (filters.searchRelaxed) {
        filters.searchRelaxed.disabled = true
      }
    }
  }

  if (item.isVeiled) {
    filters.veiled = {
      statRefs: item.statsByType
        .filter(calc => calc.type === ModifierType.Veiled)
        .map(calc => calc.stat.ref),
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
  filters.searchExact = {
    baseType: item.info.refName
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

  if (SPECIAL_SUPPORT_GEM.includes(item.info.refName)) {
    filters.gemLevel = {
      value: item.gemLevel!,
      disabled: false
    }
  } else {
    filters.gemLevel = {
      value: item.gemLevel!,
      disabled: (item.gemLevel! < 16)
    }
  }

  filters.altQuality = {
    value: item.gemAltQuality!,
    disabled: false
  }

  return filters
}

function floorToBracket (value: number, brackets: readonly number[]) {
  let prev = brackets[0]
  for (const num of brackets) {
    if (num > value) {
      return prev
    } else {
      prev = num
    }
  }
  return prev
}
