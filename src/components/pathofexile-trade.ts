import { ParsedItem, WellKnownType } from './Parser'
import { ItemRarity } from './parser-constants'
import { Leagues } from './Leagues'

const TradeOpts = {
  GemLevel: 16,
  GemLevelRange: 0,
  GemQualityRange: 0
}

const EXACT_GEM_LEVEL = ['Empower Support', 'Enlighten Support', 'Enhance Support']

interface TradeRequest { /* eslint-disable camelcase */
  query: {
    status: { option: 'online' }
    name?: string
    type?: string
    filters: {
      type_filters: {
        filters: {
          rarity: {
            option?: 'unique'
          }
        }
      }
      socket_filters: {
        filters: {
          links: {
            min?: number
            max?: number
          }
        }
      }
      misc_filters: {
        filters: {
          quality: {
            min?: number
            max?: number
          }
          gem_level: {
            min?: number
            max?: number
          }
          corrupted: {
            option?: 'true' | 'false'
          }
        }
      }
      map_filters: {
        filters: {
          map_tier: {
            min?: number
            max?: number
          }
        }
      }
    }
  }
  sort: {
    price: 'asc'
  }
}

interface SearchResult {
  id: string
  result: string[]
  total: number
}

interface FetchResult {
  id: string
  item: {
    corrupted?: boolean
    properties?: Array<{
      name: 'Quality' | 'Level'
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
  }
}

interface PricingResult {
  id: string
  corrupted?: boolean
  quality?: string
  level?: string
  listedAt: string
  priceAmount: number
  priceCurrency: string
}

export async function requestTradeResultList (item: ParsedItem) {
  const body: TradeRequest = {
    query: {
      status: { option: 'online' },
      filters: {
        type_filters: {
          filters: {
            rarity: {}
          }
        },
        socket_filters: {
          filters: {
            links: {}
          }
        },
        misc_filters: {
          filters: {
            quality: {},
            gem_level: {},
            corrupted: {}
          }
        },
        map_filters: {
          filters: {
            map_tier: {}
          }
        }
      }
    },
    sort: {
      price: 'asc'
    }
  }
  const { query } = body

  if (item.rarity === ItemRarity.Gem) {
    query.type = item.name

    if (TradeOpts.GemQualityRange > 0) {
      query.filters.misc_filters.filters.quality.min = (item.quality || 0) - TradeOpts.GemQualityRange
      query.filters.misc_filters.filters.quality.max = (item.quality || 0) + TradeOpts.GemQualityRange
    } else {
      query.filters.misc_filters.filters.quality.min = item.quality
    }

    if (EXACT_GEM_LEVEL.includes(item.name)) {
      query.filters.misc_filters.filters.gem_level.min = item.gemLevel
      query.filters.misc_filters.filters.gem_level.max = item.gemLevel
    } else if (item.gemLevel! >= TradeOpts.GemLevel) {
      if (TradeOpts.GemLevelRange > 0) {
        query.filters.misc_filters.filters.gem_level.min = item.gemLevel! - TradeOpts.GemLevelRange
        query.filters.misc_filters.filters.gem_level.max = item.gemLevel! + TradeOpts.GemLevelRange
      } else {
        query.filters.misc_filters.filters.gem_level.min = item.gemLevel!
      }
    }
  } else if (item.rarity === ItemRarity.DivinationCard) {
    query.type = item.name
  } else if (item.computed.type === WellKnownType.Map) {
    query.type = item.computed.mapName
    if (item.rarity === ItemRarity.Unique) {
      query.filters.type_filters.filters.rarity.option = 'unique'

      // NOTE:
      // 1 baseType = 1 Unique map. Now there is no need for this condition
      // if (!item.isUnidentified) {
      //   query.name = item.name
      // }
    }

    query.filters.map_filters.filters.map_tier.min = item.mapTier
    query.filters.map_filters.filters.map_tier.max = item.mapTier

    // @TODO
    // I did not find a filter in TradeMacro: by quantity and pack size
    // Should this be added for juicy corrupted maps?
  } else if (item.rarity === ItemRarity.Unique) {
    query.name = item.name
    query.type = item.baseType
  } else {
    // TODO
    if (item.rarity !== ItemRarity.Rare && item.rarity !== ItemRarity.Magic) {
      query.type = item.name
    }
  }

  if (item.isCorrupted) {
    query.filters.misc_filters.filters.corrupted.option = 'true'
  } else {
    query.filters.misc_filters.filters.corrupted.option = 'false'
  }

  if (item.linkedSockets) {
    query.filters.socket_filters.filters.links.min = item.linkedSockets
  }

  // console.log(body)

  // patch query for GGG api
  if (!query.filters.type_filters.filters.rarity.option) {
    (query as DeepPartial<TradeRequest['query']>).filters!.type_filters!.filters!.rarity = undefined
  }
  const response = await fetch(`https://www.pathofexile.com/api/trade/search/${Leagues.selected}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  const data: SearchResult = await response.json()

  return data
}

export async function requestResults (queryId: string, resultIds: string[]): Promise<PricingResult[]> {
  const response = await fetch(`https://www.pathofexile.com/api/trade/fetch/${resultIds.join(',')}?query=${queryId}`)
  const data: { result: FetchResult[] } = await response.json()

  return data.result.map(result => {
    return {
      id: result.id,
      corrupted: result.item.corrupted,
      quality: result.item.properties?.find(prop => prop.name === 'Quality')?.values[0][0],
      level: result.item.properties?.find(prop => prop.name === 'Level')?.values[0][0],
      listedAt: result.listing.indexed,
      priceAmount: result.listing.price.amount,
      priceCurrency: result.listing.price.currency
    } as PricingResult
  })
}
