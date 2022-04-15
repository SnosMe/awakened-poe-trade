import type { ItemFilters } from './interfaces'
import { ParsedItem, ItemCategory, ItemRarity, ItemInfluence } from '@/parser'
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
    exact: boolean
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
      baseType: item.info.name,
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
      baseType: item.info.name
    }
    return filters
  }
  if (item.category === ItemCategory.MetamorphSample) {
    filters.searchExact = {
      baseType: item.info.name
    }
    filters.itemLevel = {
      value: item.itemLevel!,
      disabled: false
    }
    return filters
  }
  if (
    item.category === ItemCategory.DivinationCard ||
    item.category === ItemCategory.Currency ||
    item.info.refName === 'Charged Compass'
  ) {
    filters.searchExact = {
      baseType: item.info.name
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
        baseType: item.info.name
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
  } else if (item.info.refName === 'Expedition Logbook') {
    filters.searchExact = {
      baseType: item.info.name
    }
    filters.areaLevel = {
      value: floorToBracket(item.areaLevel!, [1, 68, 73, 78, 81]),
      disabled: false
    }
  } else if (item.category === ItemCategory.HeistContract) {
    filters.searchExact = {
      baseType: item.info.name
    }
  } else if (item.category === ItemCategory.HeistBlueprint) {
    filters.searchRelaxed = {
      category: item.category,
      disabled: true // TODO: blocked by https://www.pathofexile.com/forum/view-thread/3109852
    }
    filters.searchExact = {
      baseType: item.info.name
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
      baseType: item.info.name
    }
    filters.searchRelaxed = {
      category: item.category,
      disabled: true
    }
  } else if (item.rarity === ItemRarity.Unique && item.info.unique) {
    filters.searchExact = {
      name: item.info.name,
      baseType: ITEM_BY_REF('ITEM', item.info.unique.base)![0].name
    }
  } else {
    filters.searchExact = {
      baseType: item.info.name
    }
    if (item.category && CATEGORY_TO_TRADE_ID.has(item.category)) {
      filters.searchRelaxed = {
        category: item.category,
        disabled: opts.exact
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

  if (item.influences.length && item.influences.length <= 2) {
    if (opts.exact) {
      filters.influences = item.influences.map(influecne => ({
        value: influecne,
        disabled: false
      }))
    } else if (item.influences.length === 1 && (
      item.influences[0] === ItemInfluence.Shaper ||
      item.influences[0] === ItemInfluence.Elder
    )) {
      filters.influences = [{
        value: item.influences[0],
        disabled: true
      }]
    }
  }

  if (item.itemLevel) {
    if (
      item.rarity !== ItemRarity.Unique &&
      item.category !== ItemCategory.Map &&
      item.category !== ItemCategory.Jewel && /* https://pathofexile.gamepedia.com/Jewel#Affixes */
      item.category !== ItemCategory.HeistBlueprint &&
      item.category !== ItemCategory.HeistContract &&
      item.info.refName !== 'Expedition Logbook'
    ) {
      if (item.category === ItemCategory.ClusterJewel) {
        filters.itemLevel = {
          value: floorToBracket(item.itemLevel, [1, 50, 68, 75, 84]),
          max: ceilToBracket(item.itemLevel, [100, 74, 67, 49]),
          disabled: !opts.exact
        }
      } else {
        // TODO limit level by item type
        filters.itemLevel = {
          value: Math.min(item.itemLevel, 86),
          disabled: !opts.exact
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
    baseType: item.info.name
  }

  filters.corrupted = {
    value: item.isCorrupted
  }

  if (item.info.gem!.awakened) {
    filters.gemLevel = {
      value: item.gemLevel!,
      disabled: (item.gemLevel! < 5)
    }

    if (item.isCorrupted && item.quality) {
      filters.quality = {
        value: item.quality,
        disabled: (item.quality < 20)
      }
    }

    return filters
  }

  filters.altQuality = {
    value: item.gemAltQuality!,
    disabled: false
  }

  if (SPECIAL_SUPPORT_GEM.includes(item.info.refName)) {
    filters.gemLevel = {
      value: item.gemLevel!,
      disabled: (item.gemLevel! < 3)
    }

    if (item.gemAltQuality !== 'Superior' && item.isCorrupted && item.quality) {
      filters.quality = {
        value: item.quality,
        disabled: true
      }
    }

    return filters
  }

  if (item.quality) {
    filters.quality = {
      value: item.quality,
      disabled: (item.quality < 16)
    }
  }

  filters.gemLevel = {
    value: item.gemLevel!,
    disabled: (item.gemLevel! < 19)
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

function ceilToBracket (value: number, brackets: readonly number[]) {
  let prev = brackets[0]
  for (const num of brackets) {
    if (num < value) {
      return prev
    } else {
      prev = num
    }
  }
  return prev
}
