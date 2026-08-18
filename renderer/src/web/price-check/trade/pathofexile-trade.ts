import { ItemInfluence, ItemCategory } from '@/parser'
import { ItemFilters, StatFilter, FilterOrGroup, INTERNAL_TRADE_IDS, InternalTradeId, FilterTag } from '../filters/interfaces'
import { setProperty as propSet } from 'dot-prop'
import { DateTime } from 'luxon'
import { Host } from '@/web/background/IPC'
import { TradeResponse, Account, getTradeEndpoint, adjustRateLimits, RATE_LIMIT_RULES, preventQueueCreation } from './common'
import { stat, STAT_BY_REF_V2, pseudoStatByRef } from '@/assets/data'
import { decodeFamilyFromSource as decodeMercenarySupports, SearchMode as MercSearchMode } from '../filters/pseudo/mercenary'
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
  [ItemCategory.Tincture, 'tincture'],
  [ItemCategory.Charm, 'azmeri.charm'],
  [ItemCategory.Idol, 'idol'],
  [ItemCategory.Graft, 'graft'],
  [ItemCategory.Chart, 'chart']
])

const TOTAL_MODS_TEXT = {
  CRAFTED_MODIFIERS: [
    stat('# Crafted Modifiers'),
    stat('# Crafted Prefix Modifiers'),
    stat('# Crafted Suffix Modifiers')
  ],
  EMPTY_MODIFIERS: [
    stat('# Empty Modifiers'),
    stat('# Empty Prefix Modifiers'),
    stat('# Empty Suffix Modifiers')
  ],
  TOTAL_MODIFIERS: [
    stat('# Modifiers'),
    stat('# Prefix Modifiers'),
    stat('# Suffix Modifiers')
  ]
}

const INFLUENCE_PSEUDO_TEXT = {
  [ItemInfluence.Shaper]: stat('Has Shaper Influence'),
  [ItemInfluence.Crusader]: stat('Has Crusader Influence'),
  [ItemInfluence.Hunter]: stat('Has Hunter Influence'),
  [ItemInfluence.Elder]: stat('Has Elder Influence'),
  [ItemInfluence.Redeemer]: stat('Has Redeemer Influence'),
  [ItemInfluence.Warlord]: stat('Has Warlord Influence')
}

interface FilterBoolean { option?: 'true' | 'false' }
interface FilterRange { min?: number, max?: number }

interface TradeRequest {
  query: {
    status: { option: 'online' | 'securable' | 'available' | 'any' }
    name?: string | { discriminator: string, option: string }
    type?: string | { discriminator: string, option: string }
    stats: Array<{
      type: 'and' | 'if' | 'count' | 'not' | 'mercenary'
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
          fractured_item?: FilterBoolean
          gem_imbued?: FilterBoolean
          mirrored?: FilterBoolean
          split?: FilterBoolean
          identified?: FilterBoolean
          stack_size?: FilterRange
          memory_level?: FilterRange
          foulborn_item?: FilterBoolean
          vestigial?: FilterBoolean
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
          map_iiq?: FilterRange
          map_iir?: FilterRange
          map_packsize?: FilterRange
          map_blighted?: FilterBoolean
          map_uberblighted?: FilterBoolean
          area_level?: FilterRange
          map_completion_reward?: { option?: 'any' | string }
          chart_sulphur?: FilterRange
        }
      }
      heist_filters?: {
        filters: {
          heist_wings?: FilterRange
          heist_objective_value?: { option?: 'priceless' }
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

type TradeStatGroup = TradeRequest['query']['stats'][number]

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
      78 | // Corpse Level (Filled Coffin)
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
    fee?: number
    account: Account
  }
}

export interface PricingResult {
  id: string
  itemLevel?: string
  stackSize?: number
  corrupted?: boolean
  quality?: string
  level?: string
  relativeDate: string
  priceAmount: number
  priceCurrency: string
  isMine: boolean
  hasNote: boolean
  hasFee: boolean
  accountName: string
  accountStatus: 'offline' | 'online' | 'afk'
  ign: string
}

export function createTradeRequest (filters: ItemFilters, stats: FilterOrGroup[]) {
  const body: TradeRequest = {
    query: {
      status: {
        option: filters.trade.offline
          ? 'any'
          : (filters.trade.merchantOnly ? 'securable' : 'available')
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

  if (
    filters.trade.collapseListings === 'api' &&
    (filters.trade.offline || !filters.trade.merchantOnly || filters.trade.collapseMerchant)
  ) {
    propSet(query.filters, 'trade_filters.filters.collapse.option', String(true))
  }

  if (filters.trade.listed) {
    propSet(query.filters, 'trade_filters.filters.indexed.option', filters.trade.listed)
  }

  let activeSearch = (filters.searchRelaxed && !filters.searchRelaxed.disabled)
    ? filters.searchRelaxed
    : filters.searchExact
  if (activeSearch.sub && !activeSearch.sub.disabled) {
    activeSearch = activeSearch.sub
  }

  if (activeSearch.nameTrade) {
    query.name = nameToQuery(activeSearch.nameTrade, activeSearch.discriminatorTrade)
  } else if (activeSearch.name) {
    query.name = nameToQuery(activeSearch.name, activeSearch.discriminatorTrade)
  }

  if (activeSearch.baseTypeTrade) {
    query.type = nameToQuery(activeSearch.baseTypeTrade, activeSearch.discriminatorTrade)
  } else if (activeSearch.baseType) {
    query.type = nameToQuery(activeSearch.baseType, activeSearch.discriminatorTrade)
  }

  if (filters.foil && !filters.foil.disabled) {
    propSet(query.filters, 'type_filters.filters.rarity.option', 'uniquefoil')
  } else if (filters.rarity) {
    propSet(query.filters, 'type_filters.filters.rarity.option', (filters.rarity.disabled) ? 'nonunique' : filters.rarity.value)
  }

  if (activeSearch.category) {
    const id = CATEGORY_TO_TRADE_ID.get(activeSearch.category)
    if (id) {
      propSet(query.filters, 'type_filters.filters.category.option', id)
    } else {
      throw new Error(`Invalid category: ${activeSearch.category}`)
    }
  }

  if (filters.corrupted?.value === false || filters.corrupted?.exact) {
    propSet(query.filters, 'misc_filters.filters.corrupted.option', String(filters.corrupted.value))
  }
  if (filters.fractured?.value === false) {
    propSet(query.filters, 'misc_filters.filters.fractured_item.option', String(false))
  }
  if (filters.imbuedGem?.disabled) {
    propSet(query.filters, 'misc_filters.filters.gem_imbued.option', String(false))
  }
  if (filters.split?.disabled) {
    propSet(query.filters, 'misc_filters.filters.split.option', String(false))
  }
  if (filters.foulborn?.value === false) {
    propSet(query.filters, 'misc_filters.filters.foulborn_item.option', String(false))
  }
  if (filters.vestigial?.value === false) {
    propSet(query.filters, 'misc_filters.filters.vestigial.option', String(false))
  }
  if (filters.mirrored?.disabled) {
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

  if (filters.mapCompletionReward) {
    propSet(query.filters, 'map_filters.filters.map_completion_reward.option', filters.mapCompletionReward.nameTrade)
  }

  if (filters.unidentified && !filters.unidentified.disabled) {
    propSet(query.filters, 'misc_filters.filters.identified.option', String(false))
  }

  if (filters.areaLevel && !filters.areaLevel.disabled) {
    propSet(query.filters, 'map_filters.filters.area_level.min', filters.areaLevel.value)
    if (filters.areaLevel.max) {
      propSet(query.filters, 'map_filters.filters.area_level.max', filters.areaLevel.max)
    }
  }

  if (filters.heistWingsRevealed && !filters.heistWingsRevealed.disabled) {
    propSet(query.filters, 'heist_filters.filters.heist_wings.min', filters.heistWingsRevealed.value)
  }

  if (filters.sentinelCharge && !filters.sentinelCharge.disabled) {
    propSet(query.filters, 'sentinel_filters.filters.sentinel_durability.min', filters.sentinelCharge.value)
  }

  for (const stat of stats) {
    if (stat.group || !stat.tradeId[0].startsWith('item.')) continue

    if (stat.tradeId[0] === 'item.has_empty_modifier') {
      const TARGET_ID = {
        CRAFTED_MODIFIERS: pseudoStatByRef(TOTAL_MODS_TEXT.CRAFTED_MODIFIERS[stat.option!.value])!.trade.ids[ModifierType.Pseudo][0],
        EMPTY_MODIFIERS: pseudoStatByRef(TOTAL_MODS_TEXT.EMPTY_MODIFIERS[stat.option!.value])!.trade.ids[ModifierType.Pseudo][0],
        TOTAL_MODIFIERS: pseudoStatByRef(TOTAL_MODS_TEXT.TOTAL_MODIFIERS[0])!.trade.ids[ModifierType.Pseudo][0]
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

    const input = stat.roll!
    switch (stat.tradeId[0] as InternalTradeId) {
      case 'item.base_percentile':
        propSet(query.filters, 'armour_filters.filters.base_defence_percentile.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'armour_filters.filters.base_defence_percentile.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.memory_strands':
        propSet(query.filters, 'misc_filters.filters.memory_level.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'misc_filters.filters.memory_level.max', typeof input.max === 'number' ? input.max : undefined)
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
      case 'item.map_item_quantity':
        propSet(query.filters, 'map_filters.filters.map_iiq.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'map_filters.filters.map_iiq.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.map_item_rarity':
        propSet(query.filters, 'map_filters.filters.map_iir.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'map_filters.filters.map_iir.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.map_pack_size':
        propSet(query.filters, 'map_filters.filters.map_packsize.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'map_filters.filters.map_packsize.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_agility':
        propSet(query.filters, 'heist_filters.filters.heist_agility.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_agility.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_bruteforce':
        propSet(query.filters, 'heist_filters.filters.heist_brute_force.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_brute_force.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_counterthaumaturgy':
        propSet(query.filters, 'heist_filters.filters.heist_counter_thaumaturgy.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_counter_thaumaturgy.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_deception':
        propSet(query.filters, 'heist_filters.filters.heist_deception.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_deception.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_demolition':
        propSet(query.filters, 'heist_filters.filters.heist_demolition.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_demolition.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_engineering':
        propSet(query.filters, 'heist_filters.filters.heist_engineering.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_engineering.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_lockpicking':
        propSet(query.filters, 'heist_filters.filters.heist_lockpicking.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_lockpicking.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_perception':
        propSet(query.filters, 'heist_filters.filters.heist_perception.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_perception.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_job_trapdisarmament':
        propSet(query.filters, 'heist_filters.filters.heist_trap_disarmament.min', typeof input.min === 'number' ? input.min : 1)
        propSet(query.filters, 'heist_filters.filters.heist_trap_disarmament.max', typeof input.max === 'number' ? input.max : undefined)
        break
      case 'item.heist_target_priceless':
        propSet(query.filters, 'heist_filters.filters.heist_objective_value.option', 'priceless')
        break
      case 'item.chart_sulphur':
        propSet(query.filters, 'map_filters.filters.chart_sulphur.min', typeof input.min === 'number' ? input.min : undefined)
        propSet(query.filters, 'map_filters.filters.chart_sulphur.max', typeof input.max === 'number' ? input.max : undefined)
        break
    }
  }

  stats = stats.map(stat => {
    if (!stat.group && stat.tag === FilterTag.MercenaryPrimary) {
      return { ...stat, disabled: false }
    }
    return stat
  })

  type NoUiStatFilter = Pick<StatFilter, 'not' | keyof BareStatFilter>
  const realStats: NoUiStatFilter[] = stats.filter((stat): stat is StatFilter =>
    !stat.group &&
    !INTERNAL_TRADE_IDS.includes(stat.tradeId[0]))
  if (filters.veiled) {
    for (const statRef of filters.veiled.statRefs) {
      const statOrGroup = STAT_BY_REF_V2(statRef)!
      const dbStats = ('stats' in statOrGroup) ? statOrGroup.stats : [statOrGroup]
      realStats.push({
        disabled: filters.veiled.disabled,
        tradeId: dbStats
          .filter(dbStat => ModifierType.Veiled in dbStat.trade.ids)
          .map(dbStat => dbStat.trade.ids[ModifierType.Veiled][0])
      })
    }
  }

  if (filters.influences) {
    for (const influence of filters.influences) {
      realStats.push({
        disabled: influence.disabled,
        tradeId: pseudoStatByRef(INFLUENCE_PSEUDO_TEXT[influence.value])!.trade.ids[ModifierType.Pseudo]
      })
    }
  }

  const qAnd = query.stats[0]
  const qNot: TradeStatGroup = {
    type: 'not',
    filters: []
  }

  for (const group of stats) {
    if (group.group === 'not') {
      query.stats.push({
        type: 'not',
        disabled: group.meta.disabled,
        filters: group.stats.flatMap(stat => everyTradeIdToQuery(stat))
      })
    } else if (group.group === 'mercenary') {
      const { meta: skill, stats } = group

      if (skill.tag === FilterTag.MercenaryPrimary) {
        appendAndFilter({ ...skill, disabled: false }, qAnd, query.stats)
      } else if (!skill.disabled) {
        appendAndFilter(skill, qAnd, query.stats)
      }

      const socketedSupports = stats.filter(stat => !stat.not && !INTERNAL_TRADE_IDS.includes(stat.tradeId[0]))
      const enabledOptionalGems = socketedSupports.filter(stat => !stat.disabled && stat.option!.value === MercSearchMode.Optional)
      const enabledRequiredGems = socketedSupports.filter(stat => !stat.disabled && stat.option!.value === MercSearchMode.Required)

      const localNotMode = stats.some(stat => stat.tradeId[0] === 'item.mercenary_6link')
      const localNotStats = (localNotMode) ? stats.filter(stat => stat.not && !stat.disabled) : []

      for (const stat of stats) {
        if (skill.disabled || enabledRequiredGems.length === 5) break

        if (stat.not) {
          if (localNotMode) continue

          // add only when enabled, so we don't clutter web UI when players
          // want to open in a browser and check the filters applied
          if (!stat.disabled) {
            qNot.filters.push(...everyTradeIdToQuery(stat))
          }
        } else if (stat.tradeId[0] === 'item.mercenary_6link') {
          const forceEnabled = (stat.disabled && localNotStats.length > 0)
          if (stat.disabled && !forceEnabled) continue

          const possibleSupports = stat.sources
            .map(source => decodeMercenarySupports(source))
            .filter(family => !localNotStats.some(notStat =>
              notStat.statRef === family[0].mercenary!.canonical ||
              notStat.statRef === family[0].ref
            ))
          let tier3Count = (typeof stat.roll?.min === 'number') ? Math.min(Math.max(stat.roll.min, 0), 5) : 0
          if (forceEnabled) {
            tier3Count = 0
          }

          if (tier3Count < 5) {
            // 6-Link group
            query.stats.push({
              type: 'mercenary',
              disabled: false,
              ...weightedGroupToQuery({
                allOf: [skill.tradeId],
                someOf: {
                  min: 5,
                  ids: possibleSupports.map(family => {
                    if (family.length > 2) {
                      const minTier = (family[0].mercenary!.syntheticFamily) ? 3 : 2
                      family = family.filter(stat => stat.mercenary!.tier! >= minTier)
                    }
                    return family.flatMap(stat => stat.trade.ids[ModifierType.Pseudo])
                  })
                }
              })
            })
          }

          if (tier3Count > 0) {
            // Tier-3 Gems group
            query.stats.push({
              type: 'mercenary',
              disabled: false,
              ...weightedGroupToQuery({
                allOf: [skill.tradeId],
                someOf: {
                  min: tier3Count,
                  ids: possibleSupports.map(family => {
                    // we simply count any last gem in the family as Tier 3,
                    // users can override this with "Not" filter, e.g. to remove "Knockback (Tier: 1)"
                    return family[family.length - 1].trade.ids[ModifierType.Pseudo]
                  })
                }
              })
            })
          }
        }
      }

      if (enabledOptionalGems.length >= 2) {
        // Mixed N-1 & AND group
        query.stats.push({
          type: 'mercenary',
          disabled: false,
          ...weightedGroupToQuery({
            allOf: [
              skill.tradeId,
              ...enabledRequiredGems.map(stat => stat.tradeId)
            ],
            someOf: {
              min: enabledOptionalGems.length - 1,
              ids: enabledOptionalGems.map(stat => stat.tradeId)
            }
          })
        })
      } else {
        // AND group. Not using `weightedGroupToQuery` for better trade site experience
        query.stats.push({
          type: 'mercenary',
          value: (!skill.disabled && enabledRequiredGems.length)
            ? { min: 1 + enabledRequiredGems.length }
            : undefined,
          // for a Skill without any checked Support Gems we use a simple AND filter
          disabled: skill.disabled || !enabledRequiredGems.length,
          filters: [
            ...everyTradeIdToQuery(skill),
            ...socketedSupports.flatMap(stat => everyTradeIdToQuery({
              ...stat,
              option: undefined,
              disabled: (stat.option!.value === MercSearchMode.Optional) ? true : stat.disabled
            }))
          ]
        })
      }
    }
  }

  for (const stat of realStats) {
    if (stat.not) {
      qNot.filters.push(...everyTradeIdToQuery(stat))
    } else {
      appendAndFilter(stat, qAnd, query.stats)
    }
  }

  if (qNot.filters.length) {
    query.stats.push(qNot)
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
      data = _data.result.filter(res => res != null)
    }

    cache.set<FetchResult[]>(resultIds, data, Cache.deriveTtl(...RATE_LIMIT_RULES.SEARCH, ...RATE_LIMIT_RULES.FETCH))
  }

  return data.map<PricingResult>(result => {
    return {
      id: result.id,
      itemLevel: result.item.properties?.find(prop => prop.type === 78)?.values[0][0] ?? String(result.item.ilvl),
      stackSize: result.item.stackSize,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find(prop => prop.type === 6)?.values[0][0],
      level: result.item.properties?.find(prop => prop.type === 5)?.values[0][0],
      relativeDate: DateTime.fromISO(result.listing.indexed).toRelative({ style: 'short' }) ?? '',
      priceAmount: result.listing.price?.amount ?? 0,
      priceCurrency: result.listing.price?.currency ?? 'no price',
      hasNote: result.item.note != null,
      hasFee: result.listing.fee != null,
      isMine: (result.listing.account.name === opts.accountName),
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: (result.listing.fee != null)
        ? 'online'
        : result.listing.account.online
          ? (result.listing.account.online.status === 'afk' ? 'afk' : 'online')
          : 'offline'
    }
  })
}

function getMinMax (roll: StatFilter['roll'], divisor: number) {
  if (!roll) {
    return { min: undefined, max: undefined }
  }

  const sign = roll.tradeInvert ? -1 : 1
  const a = typeof roll.min === 'number' ? roll.min * sign / divisor : undefined
  const b = typeof roll.max === 'number' ? roll.max * sign / divisor : undefined

  return !roll.tradeInvert ? { min: a, max: b } : { min: b, max: a }
}

interface WeightedGroup {
  someOf?: { min: number, ids: Array<StatFilter['tradeId']> }
  allOf?: Array<StatFilter['tradeId']>
}

function weightedGroupToQuery (group: WeightedGroup): Pick<TradeStatGroup, 'value' | 'filters'> {
  const someOf = group.someOf ?? { min: 0, ids: [] }
  const allOf = group.allOf ?? []

  // max possible surplus from `someOf` ids
  const surplus = Math.max(0, someOf.ids.length - someOf.min)
  // the weight for all `allOf` conditions must overpower the `someOf` surplus
  const weight = surplus + 1

  const totalMin = someOf.min + allOf.length * weight
  const flatIds: string[] = []

  for (const familyIds of allOf) {
    for (const id of familyIds) {
      for (let i = 0; i < weight; i++) {
        flatIds.push(id)
      }
    }
  }
  flatIds.push(...someOf.ids.flatMap(familyIds => familyIds))

  return {
    value: { min: totalMin },
    filters: flatIds.map(id => ({ id }))
  }
}

type BareStatFilter = Pick<StatFilter, 'roll' | 'option' | 'disabled' | 'tradeId'>

function appendAndFilter (
  stat: BareStatFilter,
  defaultAndGroup: TradeStatGroup,
  allGroups: TradeStatGroup[]
): void {
  if (stat.tradeId.length === 1) {
    defaultAndGroup.filters.push(tradeIdToQuery(stat.tradeId[0], stat))
  } else {
    allGroups.push({
      type: 'count',
      value: { min: 1 },
      disabled: stat.disabled,
      filters: everyTradeIdToQuery(stat)
    })
  }
}

function everyTradeIdToQuery (stat: BareStatFilter) {
  return stat.tradeId.map(id => tradeIdToQuery(id, stat))
}

function tradeIdToQuery (id: string, stat: BareStatFilter) {
  let roll = stat.roll

  const divMinMax = id.startsWith('{div_by_100}') ? 100 : 1
  if (id.startsWith('{empty}') ||
    (id.startsWith('{empty_if_100}') && roll?.value === 100)
  ) {
    roll = undefined
  }
  if (id.startsWith('{')) {
    id = id.slice(id.indexOf('}') + 1)
  }

  return {
    id,
    value: {
      ...getMinMax(roll, divMinMax),
      option: stat.option != null
        ? stat.option.value
        : undefined
    },
    disabled: stat.disabled
  }
}

function nameToQuery (name: string, discriminator?: string) {
  if (!discriminator) {
    return name
  } else {
    return {
      discriminator: discriminator,
      option: name
    }
  }
}
