import { ItemInfluence, ItemCategory, ParsedItem } from '@/parser'
import { ItemFilters, StatFilter, INTERNAL_TRADE_ID } from '../filters/interfaces'
import prop from 'dot-prop'
import { MainProcess } from '@/ipc/main-process-bindings'
import { SearchResult, Account, getTradeEndpoint, adjustRateLimits, RATE_LIMIT_RULES } from './common'
import { STAT_BY_REF, TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
import { RateLimiter } from './RateLimiter'

export const CATEGORY_TO_TRADE_ID = new Map([
  [ItemCategory.AbyssJewel, 'jewel.abyss'],
  [ItemCategory.Amulet, 'accessory.amulet'],
  [ItemCategory.Belt, 'accessory.belt'],
  [ItemCategory.BodyArmour, 'armour.chest'],
  [ItemCategory.Boots, 'armour.boots'],
  [ItemCategory.Bow, 'weapon.bow'],
  [ItemCategory.Claw, 'weapon.claw'],
  [ItemCategory.Dagger, 'weapon.dagger'],
  [ItemCategory.FishingRod, 'weapon.rod'],
  [ItemCategory.Flask, 'flask'],
  [ItemCategory.Gloves, 'armour.gloves'],
  [ItemCategory.Helmet, 'armour.helmet'],
  [ItemCategory.Jewel, 'jewel'],
  [ItemCategory.OneHandedAxe, 'weapon.oneaxe'],
  [ItemCategory.OneHandedMace, 'weapon.onemace'],
  [ItemCategory.OneHandedSword, 'weapon.onesword'],
  [ItemCategory.Quiver, 'armour.quiver'],
  [ItemCategory.Ring, 'accessory.ring'],
  [ItemCategory.RuneDagger, 'weapon.runedagger'],
  [ItemCategory.Sceptre, 'weapon.sceptre'],
  [ItemCategory.Shield, 'armour.shield'],
  [ItemCategory.Staff, 'weapon.staff'],
  [ItemCategory.TwoHandedAxe, 'weapon.twoaxe'],
  [ItemCategory.TwoHandedMace, 'weapon.twomace'],
  [ItemCategory.TwoHandedSword, 'weapon.twosword'],
  [ItemCategory.Wand, 'weapon.wand'],
  [ItemCategory.Warstaff, 'weapon.warstaff'],
  [ItemCategory.ClusterJewel, 'jewel.cluster']
])

type FilterBoolean = { option?: 'true' | 'false' }
type FilterRange = { min?: number, max?: number }

interface TradeRequest { /* eslint-disable camelcase */
  query: {
    status: { option: 'online' | 'any' }
    name?: string
    type?: string
    stats: Array<{
      type: 'and' | 'if' | 'count',
      value?: FilterRange
      filters: Array<{
        id: string
        value?: {
          min?: number
          max?: number
          option?: number | string
        }
        disabled?: boolean
      }>
      disabled?: boolean
    }>
    filters: {
      type_filters?: {
        filters: {
          rarity?: {
            option?: 'unique'
          }
          category?: {
            option?: string
          }
        }
      }
      socket_filters?: {
        filters: {
          links?: FilterRange
          sockets?: {
            w?: number
          }
        }
      }
      misc_filters?: {
        filters: {
          ilvl?: FilterRange
          quality?: FilterRange
          gem_level?: FilterRange
          corrupted?: FilterBoolean
          identified?: FilterBoolean
          shaper_item?: FilterBoolean
          crusader_item?: FilterBoolean
          hunter_item?: FilterBoolean
          elder_item?: FilterBoolean
          redeemer_item?: FilterBoolean
          warlord_item?: FilterBoolean
        }
      }
      armour_filters?: {
        filters: {
          ar?: FilterRange
          es?: FilterRange
          ev?: FilterRange
          block?: FilterRange
        }
      }
      weapon_filters?: {
        filters: {
          dps?: FilterRange
          pdps?: FilterRange
          edps?: FilterRange
          crit?: FilterRange
          aps?: FilterRange
        }
      }
      map_filters?: {
        filters: {
          map_tier?: FilterRange
          map_blighted?: FilterBoolean
        }
      }
      trade_filters: {
        filters: {
          sale_type: { option: 'priced' }
          indexed?: { option?: string }
        }
      }
    }
  }
  sort: {
    price: 'asc'
  }
}

interface FetchResult {
  id: string
  item: {
    ilvl?: number
    stackSize?: number
    corrupted?: boolean
    properties?: Array<{
      name: 'Quality' | 'Level' | 'Spawns a Level %0 Monster when Harvested'
      values: [[string, number]]
    }>
  }
  listing: {
    indexed: string
    price: {
      amount: number
      currency: string
      type: '~price'
    }
    account: Account
  }
}

interface PricingResult {
  id: string
  itemLevel?: number
  stackSize?: number
  corrupted?: boolean
  quality?: string
  level?: string
  listedAt: string
  priceAmount: number
  priceCurrency: string
  accountName: string
  accountStatus: 'offline' | 'online' | 'afk'
  ign: string
}

export function createTradeRequest (filters: ItemFilters, stats: StatFilter[], item: ParsedItem) {
  const body: TradeRequest = {
    query: {
      status: { option: filters.trade.offline ? 'any' : 'online' },
      stats: [],
      filters: {
        trade_filters: {
          filters: {
            sale_type: { option: 'priced' }
          }
        }
      }
    },
    sort: {
      price: 'asc'
    }
  }
  const { query } = body

  if (filters.trade.listed) {
    prop.set(query.filters, 'trade_filters.filters.indexed.option', filters.trade.listed)
  }

  if (filters.name) {
    query.name = TRANSLATED_ITEM_NAME_BY_REF.get(filters.name.value) ||
      filters.name.value
  }

  if (filters.baseType) {
    if (item.category === ItemCategory.CapturedBeast) {
      query.type = filters.baseType.value
    } else {
      query.type = TRANSLATED_ITEM_NAME_BY_REF.get(filters.baseType.value) ||
        filters.baseType.value
    }
  }

  if (filters.rarity) {
    prop.set(query.filters, 'type_filters.filters.rarity.option', filters.rarity.value)
  }

  if (filters.category) {
    const id = CATEGORY_TO_TRADE_ID.get(filters.category.value)
    if (id) {
      prop.set(query.filters, 'type_filters.filters.category.option', id)
    } else if (process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid category: ${filters.category.value}`)
    }
  }

  if (filters.corrupted) {
    prop.set(query.filters, 'misc_filters.filters.corrupted.option', String(filters.corrupted.value))
  }

  if (filters.gemLevel && !filters.gemLevel.disabled) {
    prop.set(query.filters, 'misc_filters.filters.gem_level.min', filters.gemLevel.min)
    prop.set(query.filters, 'misc_filters.filters.gem_level.max', filters.gemLevel.max)
  }

  if (filters.quality && !filters.quality.disabled) {
    prop.set(query.filters, 'misc_filters.filters.quality.min', filters.quality.value)
  }

  if (filters.itemLevel && !filters.itemLevel.disabled) {
    prop.set(query.filters, 'misc_filters.filters.ilvl.min', filters.itemLevel.value)
  }

  if (filters.linkedSockets && !filters.linkedSockets.disabled) {
    prop.set(query.filters, 'socket_filters.filters.links.min', filters.linkedSockets.value)
  }

  if (filters.whiteSockets && !filters.whiteSockets.disabled) {
    prop.set(query.filters, 'socket_filters.filters.sockets.w', filters.whiteSockets.value)
  }

  if (filters.mapTier) {
    prop.set(query.filters, 'map_filters.filters.map_tier.min', filters.mapTier.value)
    prop.set(query.filters, 'map_filters.filters.map_tier.max', filters.mapTier.value)
  }

  if (filters.mapBlighted) {
    prop.set(query.filters, 'map_filters.filters.map_blighted.option', String(true))
  }

  if (filters.unidentified && !filters.unidentified.disabled) {
    prop.set(query.filters, 'misc_filters.filters.identified.option', String(false))
  }

  if (filters.influences) {
    for (const influence of filters.influences) {
      if (influence.disabled) continue

      switch (influence.value) {
        case ItemInfluence.Shaper:
          prop.set(query.filters, 'misc_filters.filters.shaper_item.option', String(true))
          break
        case ItemInfluence.Elder:
          prop.set(query.filters, 'misc_filters.filters.elder_item.option', String(true))
          break
        case ItemInfluence.Crusader:
          prop.set(query.filters, 'misc_filters.filters.crusader_item.option', String(true))
          break
        case ItemInfluence.Hunter:
          prop.set(query.filters, 'misc_filters.filters.hunter_item.option', String(true))
          break
        case ItemInfluence.Redeemer:
          prop.set(query.filters, 'misc_filters.filters.redeemer_item.option', String(true))
          break
        case ItemInfluence.Warlord:
          prop.set(query.filters, 'misc_filters.filters.warlord_item.option', String(true))
          break
      }
    }
  }

  for (const stat of stats) {
    if (stat.disabled) continue

    switch (stat.tradeId[0] as INTERNAL_TRADE_ID) {
      case 'armour.armour':
        prop.set(query.filters, 'armour_filters.filters.ar.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'armour_filters.filters.ar.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'armour.evasion_rating':
        prop.set(query.filters, 'armour_filters.filters.ev.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'armour_filters.filters.ev.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'armour.energy_shield':
        prop.set(query.filters, 'armour_filters.filters.es.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'armour_filters.filters.es.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'armour.block':
        prop.set(query.filters, 'armour_filters.filters.block.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'armour_filters.filters.block.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'weapon.total_dps':
        prop.set(query.filters, 'weapon_filters.filters.dps.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'weapon_filters.filters.dps.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'weapon.physical_dps':
        prop.set(query.filters, 'weapon_filters.filters.pdps.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'weapon_filters.filters.pdps.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'weapon.elemental_dps':
        prop.set(query.filters, 'weapon_filters.filters.edps.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'weapon_filters.filters.edps.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'weapon.crit':
        prop.set(query.filters, 'weapon_filters.filters.crit.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'weapon_filters.filters.crit.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
      case 'weapon.aps':
        prop.set(query.filters, 'weapon_filters.filters.aps.min', typeof stat.min === 'number' ? stat.min : undefined)
        prop.set(query.filters, 'weapon_filters.filters.aps.max', typeof stat.max === 'number' ? stat.max : undefined)
        break
    }
  }

  stats = stats.filter(stat => !INTERNAL_TRADE_ID.includes(stat.tradeId[0]))
  if (filters.veiled) {
    const refs = filters.veiled.stat.split('<<and>>')
    for (const statRef of refs) {
      stats.push({
        disabled: filters.veiled.disabled,
        text: undefined!,
        type: undefined!,
        min: undefined,
        max: undefined,
        tradeId: STAT_BY_REF.get(statRef)!.types[0].tradeId
      })
    }
  }

  query.stats.push({ type: 'and', filters: [] })
  for (const stat of stats) {
    if (stat.tradeId.length === 1) {
      query.stats[0]!.filters.push({
        id: stat.tradeId[0],
        value: {
          ...getMinMax(stat),
          option: stat.option != null ? stat.option.tradeId : undefined
        },
        disabled: stat.disabled
      })
    } else {
      query.stats.push({
        type: 'count',
        value: { min: 1 },
        disabled: stat.disabled,
        filters: stat.tradeId.map(id => ({
          id,
          value: {
            ...getMinMax(stat),
            option: stat.option != null ? stat.option.tradeId : undefined
          }
        }))
      })
    }
  }

  return body
}

export async function requestTradeResultList (body: TradeRequest, leagueId: string) {
  await RateLimiter.waitMulti(RATE_LIMIT_RULES.SEARCH)

  const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/search/${leagueId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  RATE_LIMIT_RULES.SEARCH = adjustRateLimits(RATE_LIMIT_RULES.SEARCH, response.headers)
  const data: SearchResult = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  return data
}

export async function requestResults (queryId: string, resultIds: string[]): Promise<PricingResult[]> {
  await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH)

  const response = await fetch(`https://${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}`)
  RATE_LIMIT_RULES.FETCH = adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers)
  const data: { result: FetchResult[], error: SearchResult['error'] } = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result.map(result => {
    return {
      id: result.id,
      itemLevel:
        result.item.ilvl ||
        result.item.properties?.find(prop => prop.name === 'Spawns a Level %0 Monster when Harvested')?.values[0][0],
      stackSize: result.item.stackSize,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find(prop => prop.name === 'Quality')?.values[0][0],
      level: result.item.properties?.find(prop => prop.name === 'Level')?.values[0][0],
      listedAt: result.listing.indexed,
      priceAmount: result.listing.price.amount,
      priceCurrency: result.listing.price.currency,
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: result.listing.account.online
        ? (result.listing.account.online.status === 'afk' ? 'afk' : 'online')
        : 'offline'
    } as PricingResult
  })
}

function getMinMax (stat: StatFilter) {
  const sign = stat.invert ? -1 : 1
  const a = typeof stat.min === 'number' ? stat.min * sign : undefined
  const b = typeof stat.max === 'number' ? stat.max * sign : undefined

  return !stat.invert ? { min: a, max: b } : { min: b, max: a }
}
