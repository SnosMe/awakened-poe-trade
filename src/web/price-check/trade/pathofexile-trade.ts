import { ItemInfluence, ItemCategory, ParsedItem, ItemRarity } from '@/parser'
import { ItemFilters, StatFilter, INTERNAL_TRADE_IDS, InternalTradeId } from '../filters/interfaces'
import prop from 'dot-prop'
import { MainProcess } from '@/ipc/main-process-bindings'
import { SearchResult, Account, getTradeEndpoint, adjustRateLimits, RATE_LIMIT_RULES, preventQueueCreation } from './common'
import { STAT_BY_REF, TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
import { RateLimiter } from './RateLimiter'
import { Config } from '@/web/Config'
import { PriceCheckWidget } from '@/web/overlay/interfaces'
import { ModifierType } from '@/parser/modifiers'
import { Cache } from './Cache'

export const CATEGORY_TO_TRADE_ID = new Map([
  [ItemCategory.Map, 'map'],
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
  [ItemCategory.ClusterJewel, 'jewel.cluster'],
  [ItemCategory.HeistBlueprint, 'heistmission.blueprint'],
  [ItemCategory.HeistContract, 'heistmission.contract'],
  [ItemCategory.HeistTool, 'heistequipment.heisttool'],
  [ItemCategory.HeistBrooch, 'heistequipment.heistreward'],
  [ItemCategory.HeistGear, 'heistequipment.heistweapon'],
  [ItemCategory.HeistCloak, 'heistequipment.heistutility'],
  [ItemCategory.Trinket, 'accessory.trinket']
])

const TOTAL_MODS_TEXT = {
  CRAFTED_MODIFIERS: [
    '# Crafted Modifiers',
    '# Crafted Prefix Modifiers',
    '# Crafted Suffix Modifiers'
  ],
  EMPTY_MODIFIERS: [
    '# Empty Modifiers',
    '# Empty Prefix Modifiers',
    '# Empty Suffix Modifiers'
  ],
  TOTAL_MODIFIERS: [
    '# Modifiers',
    '# Prefix Modifiers',
    '# Suffix Modifiers'
  ]
}

const INFLUENCE_PSEUDO_TEXT = {
  [ItemInfluence.Shaper]: 'Has Shaper Influence',
  [ItemInfluence.Crusader]: 'Has Crusader Influence',
  [ItemInfluence.Hunter]: 'Has Hunter Influence',
  [ItemInfluence.Elder]: 'Has Elder Influence',
  [ItemInfluence.Redeemer]: 'Has Redeemer Influence',
  [ItemInfluence.Warlord]: 'Has Warlord Influence'
}

interface FilterBoolean { option?: 'true' | 'false' }
interface FilterRange { min?: number, max?: number }

interface TradeRequest { /* eslint-disable camelcase */
  query: {
    status: { option: 'online' | 'any' }
    name?: string | { discriminator: string, option: string }
    type?: string | { discriminator: string, option: string }
    stats: Array<{
      type: 'and' | 'if' | 'count' | 'not'
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
          mirrored?: FilterBoolean
          identified?: FilterBoolean
          stack_size?: FilterRange
          gem_alternate_quality?: { option: '0' | '1' | '2' | '3' }
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
      heist_filters?: {
        filters: {
          area_level?: FilterRange
          heist_agility?: FilterRange
          heist_brute_force?: FilterRange
          heist_counter_thaumaturgy?: FilterRange
          heist_deception?: FilterRange
          heist_demolition?: FilterRange
          heist_engineering?: FilterRange
          heist_lockpicking?: FilterRange
          heist_perception?: FilterRange
          heist_trap_disarmament?: FilterRange
        }
      }
      trade_filters?: {
        filters: {
          collapse?: FilterBoolean
          indexed?: { option?: string }
          price?: FilterRange | { option?: string }
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
      values: [[string, number]]
      type:
      30 | // Spawns a Level %0 Monster when Harvested
      6 | // Quality
      5 // Level
    }>
  }
  listing: {
    indexed: string
    price?: {
      amount: number
      currency: string
      type: '~price'
    }
    account: Account
  }
}

export interface PricingResult {
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
      stats: [
        { type: 'and', filters: [] }
      ],
      filters: {}
    },
    sort: {
      price: 'asc'
    }
  }
  const { query } = body

  {
    const cfg = Config.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget
    if (cfg.chaosPriceThreshold !== 0) {
      prop.set(query.filters, 'trade_filters.filters.price.min', cfg.chaosPriceThreshold)
    }
    if (cfg.collapseListings === 'api') {
      prop.set(query.filters, 'trade_filters.filters.collapse.option', String(true))
    }
  }

  if (filters.trade.listed) {
    prop.set(query.filters, 'trade_filters.filters.indexed.option', filters.trade.listed)
  }

  if (filters.name) {
    query.name = nameToQuery(filters.name.value, filters, true)
  }

  if (filters.baseType) {
    if (item.category === ItemCategory.CapturedBeast) {
      query.type = nameToQuery(filters.baseType.value, filters, false)
    } else {
      query.type = nameToQuery(filters.baseType.value, filters, true)
    }
  }

  if (filters.rarity) {
    prop.set(query.filters, 'type_filters.filters.rarity.option', filters.rarity.value)
  }

  if (filters.category) {
    const id = CATEGORY_TO_TRADE_ID.get(filters.category.value)
    if (id) {
      prop.set(query.filters, 'type_filters.filters.category.option', id)
    } else {
      throw new Error(`Invalid category: ${filters.category.value}`)
    }
  }

  if (filters.corrupted) {
    prop.set(query.filters, 'misc_filters.filters.corrupted.option', String(filters.corrupted.value))
  }
  if (filters.mirrored) {
    prop.set(query.filters, 'misc_filters.filters.mirrored.option', String(filters.mirrored.value))
  } else if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare
  ) {
    prop.set(query.filters, 'misc_filters.filters.mirrored.option', String(false))
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

  if (filters.stackSize && !filters.stackSize.disabled) {
    prop.set(query.filters, 'misc_filters.filters.stack_size.min', filters.stackSize.value)
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

  if (filters.altQuality && !filters.altQuality.disabled) {
    switch (filters.altQuality.value) {
      case 'Superior':
        prop.set(query.filters, 'misc_filters.filters.gem_alternate_quality.option', '0')
        break
      case 'Anomalous':
        prop.set(query.filters, 'misc_filters.filters.gem_alternate_quality.option', '1')
        break
      case 'Divergent':
        prop.set(query.filters, 'misc_filters.filters.gem_alternate_quality.option', '2')
        break
      case 'Phantasmal':
        prop.set(query.filters, 'misc_filters.filters.gem_alternate_quality.option', '3')
        break
    }
  }

  if (filters.areaLevel) {
    prop.set(query.filters, 'heist_filters.filters.area_level.min', filters.areaLevel.value)
  }

  if (filters.heistJob) {
    switch (filters.heistJob.name) {
      case 'Agility':
        prop.set(query.filters, 'heist_filters.filters.heist_agility.min', filters.heistJob.level)
        break
      case 'Brute Force':
        prop.set(query.filters, 'heist_filters.filters.heist_brute_force.min', filters.heistJob.level)
        break
      case 'Counter-Thaumaturgy':
        prop.set(query.filters, 'heist_filters.filters.heist_counter_thaumaturgy.min', filters.heistJob.level)
        break
      case 'Deception':
        prop.set(query.filters, 'heist_filters.filters.heist_deception.min', filters.heistJob.level)
        break
      case 'Demolition':
        prop.set(query.filters, 'heist_filters.filters.heist_demolition.min', filters.heistJob.level)
        break
      case 'Engineering':
        prop.set(query.filters, 'heist_filters.filters.heist_engineering.min', filters.heistJob.level)
        break
      case 'Lockpicking':
        prop.set(query.filters, 'heist_filters.filters.heist_lockpicking.min', filters.heistJob.level)
        break
      case 'Perception':
        prop.set(query.filters, 'heist_filters.filters.heist_perception.min', filters.heistJob.level)
        break
      case 'Trap Disarmament':
        prop.set(query.filters, 'heist_filters.filters.heist_trap_disarmament.min', filters.heistJob.level)
        break
    }
  }

  for (const stat of stats) {
    if (stat.tradeId[0] === 'map.no_elder_guardian') {
      query.stats.push({
        type: 'not',
        disabled: stat.disabled,
        filters: [
          tradeIdToQuery(STAT_BY_REF.get('Map is occupied by #')!.trade.ids[ModifierType.Implicit][0], stat)
        ]
      })
    }

    if (stat.tradeId[0] === 'item.has_empty_modifier') {
      const TARGET_ID = {
        CRAFTED_MODIFIERS: STAT_BY_REF.get(TOTAL_MODS_TEXT.CRAFTED_MODIFIERS[stat.roll!])!.trade.ids[ModifierType.Pseudo][0],
        EMPTY_MODIFIERS: STAT_BY_REF.get(TOTAL_MODS_TEXT.EMPTY_MODIFIERS[stat.roll!])!.trade.ids[ModifierType.Pseudo][0],
        TOTAL_MODIFIERS: STAT_BY_REF.get(TOTAL_MODS_TEXT.TOTAL_MODIFIERS[0])!.trade.ids[ModifierType.Pseudo][0]
      }

      query.stats.push({
        type: 'count',
        value: { min: 1, max: 1 },
        disabled: stat.disabled,
        filters: [
          { id: TARGET_ID.EMPTY_MODIFIERS, value: { min: 1, max: 1 }, disabled: stat.disabled },
          { id: TARGET_ID.CRAFTED_MODIFIERS, value: { min: 1, max: undefined }, disabled: stat.disabled }
        ]
      })

      query.stats.push({
        type: 'count',
        value: { min: 1, max: 1 },
        disabled: stat.disabled,
        filters: [
          { id: TARGET_ID.EMPTY_MODIFIERS, value: { min: 1, max: 1 }, disabled: stat.disabled },
          { id: TARGET_ID.TOTAL_MODIFIERS, value: { min: 6, max: undefined }, disabled: stat.disabled }
        ]
      })
    }

    if (stat.disabled) continue

    switch (stat.tradeId[0] as InternalTradeId) {
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

  stats = stats.filter(stat => !INTERNAL_TRADE_IDS.includes(stat.tradeId[0] as any))
  if (filters.veiled) {
    const refs = filters.veiled.stat.split('<<and>>')
    for (const statRef of refs) {
      stats.push({
        disabled: filters.veiled.disabled,
        statRef: undefined!,
        text: undefined!,
        type: undefined!,
        min: undefined,
        max: undefined,
        tradeId: STAT_BY_REF.get(statRef)!.trade.ids[ModifierType.Veiled]
      })
    }
  }

  if (filters.influences) {
    for (const influence of filters.influences) {
      stats.push({
        disabled: influence.disabled,
        statRef: undefined!,
        text: undefined!,
        type: undefined!,
        min: undefined,
        max: undefined,
        tradeId: STAT_BY_REF.get(INFLUENCE_PSEUDO_TEXT[influence.value])!.trade.ids[ModifierType.Pseudo]
      })
    }
  }

  const qAnd = query.stats[0]
  for (const stat of stats) {
    if (stat.tradeId.length === 1) {
      qAnd.filters.push(tradeIdToQuery(stat.tradeId[0], stat))
    } else {
      query.stats.push({
        type: 'count',
        value: { min: 1 },
        disabled: stat.disabled,
        filters: stat.tradeId.map(id => tradeIdToQuery(id, stat))
      })
    }
  }

  return body
}

const cache = new Cache()

export async function requestTradeResultList (body: TradeRequest, leagueId: string): Promise<SearchResult> {
  let data = cache.get<SearchResult>([body, leagueId])

  if (!data) {
    preventQueueCreation([
      { count: 1, limiters: RATE_LIMIT_RULES.SEARCH },
      { count: 1, limiters: RATE_LIMIT_RULES.FETCH }
    ])

    await RateLimiter.waitMulti(RATE_LIMIT_RULES.SEARCH)

    const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/search/${leagueId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, response.headers)

    data = await response.json() as SearchResult
    if (data.error) {
      throw new Error(data.error.message)
    }

    cache.set<SearchResult>([body, leagueId], data, Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH))
  }

  return data
}

export async function requestResults (queryId: string, resultIds: string[]): Promise<PricingResult[]> {
  interface ResponseT { result: FetchResult[], error: SearchResult['error'] }
  let data = cache.get<ResponseT>(resultIds)

  if (!data) {
    await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH)

    const response = await fetch(`https://${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}`)
    adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers)

    data = await response.json() as ResponseT
    if (data.error) {
      throw new Error(data.error.message)
    }

    cache.set<ResponseT>(resultIds, data, Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH))
  }

  return data.result.map<PricingResult>(result => {
    return {
      id: result.id,
      itemLevel:
        result.item.ilvl ||
        Number(result.item.properties?.find(prop => prop.type === 30)?.values[0][0]),
      stackSize: result.item.stackSize,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find(prop => prop.type === 6)?.values[0][0],
      level: result.item.properties?.find(prop => prop.type === 5)?.values[0][0],
      listedAt: result.listing.indexed,
      priceAmount: result.listing.price?.amount ?? 0,
      priceCurrency: result.listing.price?.currency ?? 'no price',
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: result.listing.account.online
        ? (result.listing.account.online.status === 'afk' ? 'afk' : 'online')
        : 'offline'
    }
  })
}

function getMinMax (stat: StatFilter) {
  const sign = stat.invert ? -1 : 1
  const a = typeof stat.min === 'number' ? stat.min * sign : undefined
  const b = typeof stat.max === 'number' ? stat.max * sign : undefined

  return !stat.invert ? { min: a, max: b } : { min: b, max: a }
}

function tradeIdToQuery (id: string, stat: StatFilter) {
  return {
    id,
    value: {
      ...getMinMax(stat),
      option: stat.option != null
        ? (stat.option === 'str' ? String : Number)(stat.roll!)
        : undefined
    },
    disabled: stat.disabled
  }
}

function nameToQuery (name: string, filters: ItemFilters, translate: boolean) {
  if (translate) {
    name = TRANSLATED_ITEM_NAME_BY_REF.get(name) || name
  }

  if (!filters.discriminator) {
    return name
  } else {
    return {
      discriminator: filters.discriminator.value.toLowerCase(),
      option: name
    }
  }
}
