import { ItemInfluence, ItemCategory, ParsedItem, ItemRarity } from '@/parser'
import { ItemFilters, StatFilter, INTERNAL_TRADE_IDS, InternalTradeId } from '../filters/interfaces'
import { setProperty as propSet } from 'dot-prop'
import { DateTime } from 'luxon'
import { Host } from '@/web/background/IPC'
import { TradeResponse, Account, getTradeEndpoint, adjustRateLimits, RATE_LIMIT_RULES, preventQueueCreation } from './common'
import { STAT_BY_REF } from '@/assets/data'
import { RateLimiter } from './RateLimiter'
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
  [ItemCategory.Trinket, 'accessory.trinket'],
  [ItemCategory.SanctumRelic, 'sanctum.relic'],
  [ItemCategory.Tincture, 'azmeri.tincture'],
  [ItemCategory.Charm, 'azmeri.charm']
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
    status: { option: 'online' | 'onlineleague' | 'any' }
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
            option?: 'nonunique' | 'uniquefoil'
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
        }
      }
      armour_filters?: {
        filters: {
          ar?: FilterRange
          es?: FilterRange
          ev?: FilterRange
          ward?: FilterRange
          block?: FilterRange
          base_defence_percentile?: FilterRange
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
          map_uberblighted?: FilterBoolean
          area_level?: FilterRange
        }
      }
      heist_filters?: {
        filters: {
          heist_wings?: FilterRange
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
      sentinel_filters?: {
        filters: {
          sentinel_durability?: FilterRange
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

export interface SearchResult {
  id: string
  result: string[]
  total: number
  inexact?: boolean
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
    note?: string
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
  relativeDate: string
  priceAmount: number
  priceCurrency: string
  isMine: boolean
  hasNote: boolean
  accountName: string
  accountStatus: 'offline' | 'online' | 'afk'
  ign: string
}

export function createTradeRequest (filters: ItemFilters, stats: StatFilter[], item: ParsedItem) {
  const body: TradeRequest = {
    query: {
      status: {
        option: filters.trade.offline
          ? 'any'
          : (filters.trade.onlineInLeague ? 'onlineleague' : 'online')
      },
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

  if (filters.trade.currency) {
    propSet(query.filters, 'trade_filters.filters.price.option', filters.trade.currency)
  }

  if (filters.trade.collapseListings === 'api') {
    propSet(query.filters, 'trade_filters.filters.collapse.option', String(true))
  }

  if (filters.trade.listed) {
    propSet(query.filters, 'trade_filters.filters.indexed.option', filters.trade.listed)
  }

  const activeSearch = (filters.searchRelaxed && !filters.searchRelaxed.disabled)
    ? filters.searchRelaxed
    : filters.searchExact

  if (activeSearch.nameTrade) {
    query.name = nameToQuery(activeSearch.nameTrade, filters)
  } else if (activeSearch.name) {
    query.name = nameToQuery(activeSearch.name, filters)
  }

  if (activeSearch.baseTypeTrade) {
    query.type = nameToQuery(activeSearch.baseTypeTrade, filters)
  } else if (activeSearch.baseType) {
    query.type = nameToQuery(activeSearch.baseType, filters)
  }

  if (filters.foil && !filters.foil.disabled) {
    propSet(query.filters, 'type_filters.filters.rarity.option', 'uniquefoil')
  } else if (filters.rarity) {
    propSet(query.filters, 'type_filters.filters.rarity.option', filters.rarity.value)
  }

  if (activeSearch.category) {
    const id = CATEGORY_TO_TRADE_ID.get(activeSearch.category)
    if (id) {
      propSet(query.filters, 'type_filters.filters.category.option', id)
    } else {
      throw new Error(`Invalid category: ${activeSearch.category}`)
    }
  }

  if (filters.corrupted?.value === false) {
    propSet(query.filters, 'misc_filters.filters.corrupted.option', String(false))
  }
  if (filters.mirrored) {
    if (filters.mirrored.disabled) {
      propSet(query.filters, 'misc_filters.filters.mirrored.option', String(false))
    }
  } else if (
    item.rarity === ItemRarity.Normal ||
    item.rarity === ItemRarity.Magic ||
    item.rarity === ItemRarity.Rare
  ) {
    propSet(query.filters, 'misc_filters.filters.mirrored.option', String(false))
  }

  if (filters.gemLevel && !filters.gemLevel.disabled) {
    propSet(query.filters, 'misc_filters.filters.gem_level.min', filters.gemLevel.value)
  }

  if (filters.quality && !filters.quality.disabled) {
    propSet(query.filters, 'misc_filters.filters.quality.min', filters.quality.value)
  }

  if (filters.itemLevel && !filters.itemLevel.disabled) {
    propSet(query.filters, 'misc_filters.filters.ilvl.min', filters.itemLevel.value)
    if (filters.itemLevel.max) {
      propSet(query.filters, 'misc_filters.filters.ilvl.max', filters.itemLevel.max)
    }
  }

  if (filters.stackSize && !filters.stackSize.disabled) {
    propSet(query.filters, 'misc_filters.filters.stack_size.min', filters.stackSize.value)
  }

  if (filters.linkedSockets && !filters.linkedSockets.disabled) {
    propSet(query.filters, 'socket_filters.filters.links.min', filters.linkedSockets.value)
  }

  if (filters.whiteSockets && !filters.whiteSockets.disabled) {
    propSet(query.filters, 'socket_filters.filters.sockets.w', filters.whiteSockets.value)
  }

  if (filters.mapTier && !filters.mapTier.disabled) {
    propSet(query.filters, 'map_filters.filters.map_tier.min', filters.mapTier.value)
    propSet(query.filters, 'map_filters.filters.map_tier.max', filters.mapTier.value)
  }

  if (filters.mapBlighted) {
    if (filters.mapBlighted.value === 'Blighted') {
      propSet(query.filters, 'map_filters.filters.map_blighted.option', String(true))
    } else if (filters.mapBlighted.value === 'Blight-ravaged') {
      propSet(query.filters, 'map_filters.filters.map_uberblighted.option', String(true))
    }
  }

  if (filters.unidentified && !filters.unidentified.disabled) {
    propSet(query.filters, 'misc_filters.filters.identified.option', String(false))
  }

  if (filters.areaLevel && !filters.areaLevel.disabled) {
    propSet(query.filters, 'map_filters.filters.area_level.min', filters.areaLevel.value)
  }

  if (filters.heistWingsRevealed && !filters.heistWingsRevealed.disabled) {
    propSet(query.filters, 'heist_filters.filters.heist_wings.min', filters.heistWingsRevealed.value)
  }

  if (filters.sentinelCharge && !filters.sentinelCharge.disabled) {
    propSet(query.filters, 'sentinel_filters.filters.sentinel_durability.min', filters.sentinelCharge.value)
  }

  for (const stat of stats) {
    if (stat.tradeId[0] === 'item.has_empty_modifier') {
      const TARGET_ID = {
        CRAFTED_MODIFIERS: STAT_BY_REF(TOTAL_MODS_TEXT.CRAFTED_MODIFIERS[stat.option!.value])!.trade.ids[ModifierType.Pseudo][0],
        EMPTY_MODIFIERS: STAT_BY_REF(TOTAL_MODS_TEXT.EMPTY_MODIFIERS[stat.option!.value])!.trade.ids[ModifierType.Pseudo][0],
        TOTAL_MODIFIERS: STAT_BY_REF(TOTAL_MODS_TEXT.TOTAL_MODIFIERS[0])!.trade.ids[ModifierType.Pseudo][0]
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
    } else if ( // https://github.com/SnosMe/awakened-poe-trade/issues/758
      item.category === ItemCategory.Flask &&
      stat.statRef === '#% increased Charge Recovery' &&
      !stats.some(s => s.statRef === '#% increased effect')
    ) {
      const reducedEffectId = STAT_BY_REF('#% increased effect')!.trade.ids[ModifierType.Explicit][0]
      query.stats.push({
        type: 'not',
        disabled: stat.disabled,
        filters: [
          { id: reducedEffectId, disabled: stat.disabled }
        ]
      })
    }

    if (stat.disabled) continue

    const input = stat.roll!
    switch (stat.tradeId[0] as InternalTradeId) {
      case 'item.base_percentile':
        propSet(query.filters, 'armour_filters.filters.base_defence_percentile.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.base_defence_percentile.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.armour':
        propSet(query.filters, 'armour_filters.filters.ar.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.ar.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.evasion_rating':
        propSet(query.filters, 'armour_filters.filters.ev.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.ev.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.energy_shield':
        propSet(query.filters, 'armour_filters.filters.es.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.es.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.ward':
        propSet(query.filters, 'armour_filters.filters.ward.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.ward.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.block':
        propSet(query.filters, 'armour_filters.filters.block.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.block.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.total_dps':
        propSet(query.filters, 'weapon_filters.filters.dps.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'weapon_filters.filters.dps.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.physical_dps':
        propSet(query.filters, 'weapon_filters.filters.pdps.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'weapon_filters.filters.pdps.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.elemental_dps':
        propSet(query.filters, 'weapon_filters.filters.edps.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'weapon_filters.filters.edps.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.crit':
        propSet(query.filters, 'weapon_filters.filters.crit.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'weapon_filters.filters.crit.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.aps':
        propSet(query.filters, 'weapon_filters.filters.aps.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'weapon_filters.filters.aps.max', typeof input.max === 'number' ? input.max : undefined)
        break
    }
  }

  stats = stats.filter(stat => !INTERNAL_TRADE_IDS.includes(stat.tradeId[0] as any))
  if (filters.veiled) {
    for (const statRef of filters.veiled.statRefs) {
      stats.push({
        disabled: filters.veiled.disabled,
        statRef: undefined!,
        text: undefined!,
        tag: undefined!,
        sources: undefined!,
        tradeId: STAT_BY_REF(statRef)!.trade.ids[ModifierType.Veiled]
      })
    }
  }

  if (filters.influences) {
    for (const influence of filters.influences) {
      stats.push({
        disabled: influence.disabled,
        statRef: undefined!,
        text: undefined!,
        tag: undefined!,
        sources: undefined!,
        tradeId: STAT_BY_REF(INFLUENCE_PSEUDO_TEXT[influence.value])!.trade.ids[ModifierType.Pseudo]
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

    const response = await Host.proxy(`${getTradeEndpoint()}/api/trade/search/${leagueId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    adjustRateLimits(RATE_LIMIT_RULES.SEARCH, response.headers)

    const _data = await response.json() as TradeResponse<SearchResult>
    if (_data.error) {
      throw new Error(_data.error.message)
    } else {
      data = _data
    }

    cache.set<SearchResult>([body, leagueId], data, Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH))
  }

  return data
}

export async function requestResults (
  queryId: string,
  resultIds: string[],
  opts: { accountName: string }
): Promise<PricingResult[]> {
  let data = cache.get<FetchResult[]>(resultIds)

  if (!data) {
    await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH)

    const response = await Host.proxy(`${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}`)
    adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers)

    const _data = await response.json() as TradeResponse<{ result: Array<FetchResult | null> }>
    if (_data.error) {
      throw new Error(_data.error.message)
    } else {
      data = _data.result.filter(res => res != null) as FetchResult[]
    }

    cache.set<FetchResult[]>(resultIds, data, Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH))
  }

  return data.map<PricingResult>(result => {
    return {
      id: result.id,
      itemLevel: result.item.ilvl,
      stackSize: result.item.stackSize,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find(prop => prop.type === 6)?.values[0][0],
      level: result.item.properties?.find(prop => prop.type === 5)?.values[0][0],
      relativeDate: DateTime.fromISO(result.listing.indexed).toRelative({ style: 'short' }) ?? '',
      priceAmount: result.listing.price?.amount ?? 0,
      priceCurrency: result.listing.price?.currency ?? 'no price',
      hasNote: result.item.note != null,
      isMine: (result.listing.account.name === opts.accountName),
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: result.listing.account.online
        ? (result.listing.account.online.status === 'afk' ? 'afk' : 'online')
        : 'offline'
    }
  })
}

function getMinMax (roll: StatFilter['roll']) {
  if (!roll) {
    return { min: undefined, max: undefined }
  }

  const sign = roll.tradeInvert ? -1 : 1
  const a = typeof roll.min === 'number' ? roll.min * sign : undefined
  const b = typeof roll.max === 'number' ? roll.max * sign : undefined

  return !roll.tradeInvert ? { min: a, max: b } : { min: b, max: a }
}

function tradeIdToQuery (id: string, stat: StatFilter) {
  // NOTE: if there will be too many overrides in the future,
  //       consider moving them to stats.ndjson

  let roll = stat.roll

  // fixes Corrupted Implicit "Bleeding cannot be inflicted on you"
  if (id.endsWith('stat_1901158930')) {
    if (stat.roll?.value === 100) {
      roll = undefined // stat semantic type is flag
    }
  // fixes "Instant Recovery" on Flasks
  } else if (id.endsWith('stat_1526933524')) {
    if (stat.roll?.value === 100) {
      roll = undefined // stat semantic type is flag
    }
  // fixes Delve "Reservation Efficiency of Skills"
  } else if (id.endsWith('stat_1269219558')) {
    roll = { ...roll!, tradeInvert: !(roll!.tradeInvert) }
  }

  return {
    id,
    value: {
      ...getMinMax(roll),
      option: stat.option != null
        ? stat.option.value
        : undefined
    },
    disabled: stat.disabled
  }
}

function nameToQuery (name: string, filters: ItemFilters) {
  if (!filters.discriminator) {
    return name
  } else {
    return {
      discriminator: filters.discriminator.trade,
      option: name
    }
  }
}
