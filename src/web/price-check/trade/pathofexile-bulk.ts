import { MainProcess } from '@/ipc/main-process-bindings'
import { selected as league } from '@/web/background/Leagues'
import { SearchResult, Account, getTradeEndpoint, RATE_LIMIT_RULES, adjustRateLimits, tradeTag, preventQueueCreation } from './common'
import { RateLimiter } from './RateLimiter'
import { ItemFilters } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { Cache } from './Cache'

interface TradeRequest { /* eslint-disable camelcase */
  exchange: {
    status: { option: 'online' }
    have: string[]
    want: string[]
    minimum?: number
    fulfillable?: null
  }
}

interface FetchResult {
  id: string
  listing: {
    indexed: string
    price: {
      exchange: {
        amount: number
      }
      item: {
        amount: number
        stock: number
      }
    }
    account: Account
  }
}

export interface PricingResult {
  id: string
  listedAt: string
  exchangeAmount: number
  itemAmount: number
  stock: number
  accountStatus: 'offline' | 'online' | 'afk'
  accountName: string
  ign: string
}

const cache = new Cache()

async function requestTradeResultList (body: TradeRequest): Promise<SearchResult> {
  let data = cache.get<SearchResult>([body, league.value])

  if (!data) {
    preventQueueCreation([
      { count: 2, limiters: RATE_LIMIT_RULES.EXCHANGE },
      { count: 1, limiters: RATE_LIMIT_RULES.FETCH }
    ])

    await RateLimiter.waitMulti(RATE_LIMIT_RULES.EXCHANGE)

    const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/exchange/${league.value}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    adjustRateLimits(RATE_LIMIT_RULES.EXCHANGE, response.headers)

    data = await response.json() as SearchResult
    if (data.error) {
      throw new Error(data.error.message)
    }

    cache.set<SearchResult>([body, league.value], data, Cache.deriveTtl(...RATE_LIMIT_RULES.EXCHANGE, ...RATE_LIMIT_RULES.FETCH))
  }

  return data
}

export async function requestResults (queryId: string, resultIds: string[]): Promise<PricingResult[]> {
  interface ResponseT { result: FetchResult[], error: SearchResult['error'] }
  let data = cache.get<ResponseT>(resultIds)

  if (!data) {
    await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH)

    const response = await fetch(`https://${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}&exchange`)
    adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers)

    data = await response.json() as ResponseT
    if (data.error) {
      throw new Error(data.error.message)
    }

    cache.set<ResponseT>(resultIds, data, Cache.deriveTtl(...RATE_LIMIT_RULES.EXCHANGE, ...RATE_LIMIT_RULES.FETCH))
  }

  return data.result
    .filter(result => result != null) // { gone: true }
    .map<PricingResult>(result => {
    return {
      id: result.id,
      listedAt: result.listing.indexed,
      exchangeAmount: result.listing.price.exchange.amount,
      itemAmount: result.listing.price.item.amount,
      stock: result.listing.price.item.stock,
      ign: result.listing.account.lastCharacterName,
      accountName: result.listing.account.name,
      accountStatus: result.listing.account.online
        ? (result.listing.account.online.status === 'afk' ? 'afk' : 'online')
        : 'offline'
    }
  })
}

export interface BulkSearch {
  exa: {
    queryId: string
    total: number
    listedIds: string[]
  }
  chaos: {
    queryId: string
    total: number
    listedIds: string[]
  }
}

const HAVE_CURRENCY = ['exalted', 'chaos']

export async function execBulkSearch (item: ParsedItem, filters: ItemFilters): Promise<BulkSearch> {
  const resultByHave = await Promise.all(HAVE_CURRENCY.map(async (have) => {
    const query = await requestTradeResultList({
      exchange: {
        have: [have],
        want: [tradeTag(item)!],
        status: { option: 'online' },
        minimum: (filters.stackSize && !filters.stackSize.disabled) ? filters.stackSize.value : undefined
        // fulfillable: null
      }
    })

    return {
      queryId: query.id,
      total: query.total,
      listedIds: query.result
    }
  }))

  return {
    exa: resultByHave[0],
    chaos: resultByHave[1]
  }
}
