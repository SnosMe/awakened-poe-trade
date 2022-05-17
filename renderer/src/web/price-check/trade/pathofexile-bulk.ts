import { DateTime } from 'luxon'
import { MainProcess } from '@/web/background/IPC'
import { SearchResult, Account, getTradeEndpoint, RATE_LIMIT_RULES, adjustRateLimits, tradeTag, preventQueueCreation } from './common'
import { RateLimiter } from './RateLimiter'
import { ItemFilters } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { Cache } from './Cache'

interface TradeRequest { /* eslint-disable camelcase */
  engine: 'new' // TODO: blocked by https://www.pathofexile.com/forum/view-thread/3265663
  query: {
    status: { option: 'online' | 'onlineleague' | 'any' }
    have: string[]
    want: string[]
    minimum?: number
    fulfillable?: null
  }
}

interface FetchResult {
  id: string
  listing: {
    // indexed: string // not available in legacy engine now
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
  relativeDate: string
  exchangeAmount: number
  itemAmount: number
  stock: number
  accountStatus: 'offline' | 'online' | 'afk'
  isMine: boolean
  accountName: string
  ign: string
}

const cache = new Cache()

async function requestTradeResultList (body: TradeRequest, leagueId: string): Promise<SearchResult> {
  let data = cache.get<SearchResult>([body, leagueId])

  if (!data) {
    preventQueueCreation([
      { count: 2, limiters: RATE_LIMIT_RULES.EXCHANGE },
      { count: 1, limiters: RATE_LIMIT_RULES.FETCH }
    ])

    await RateLimiter.waitMulti(RATE_LIMIT_RULES.EXCHANGE)

    const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/exchange/${leagueId}`, {
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

    cache.set<SearchResult>([body, leagueId], data, Cache.deriveTtl(...RATE_LIMIT_RULES.EXCHANGE, ...RATE_LIMIT_RULES.FETCH))
  }

  return data
}

export async function requestResults (
  queryId: string,
  resultIds: string[],
  opts: { accountName: string }
): Promise<PricingResult[]> {
  interface ResponseT { result: FetchResult[], error: SearchResult['error'] }
  let data = cache.get<ResponseT>(resultIds)

  if (!data) {
    await RateLimiter.waitMulti(RATE_LIMIT_RULES.FETCH)

    const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}&exchange`)
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
      relativeDate: DateTime.fromISO('').toRelative({ style: 'short' }) ?? '',
      exchangeAmount: result.listing.price.exchange.amount,
      itemAmount: result.listing.price.item.amount,
      stock: result.listing.price.item.stock,
      isMine: (result.listing.account.name === opts.accountName),
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
      engine: 'new',
      query: {
        have: [have],
        want: [tradeTag(item)!],
        status: {
          option: filters.trade.offline
            ? 'any'
            : (filters.trade.onlineInLeague ? 'onlineleague' : 'online')
        },
        minimum: (filters.stackSize && !filters.stackSize.disabled) ? filters.stackSize.value : undefined
        // fulfillable: null
      }
    }, filters.trade.league)

    return {
      queryId: query.id,
      total: query.total,
      listedIds:
        Object.entries(query.result).sort(
          (a, b) =>
            ((a[1].listing.offers[0].exchange.amount / a[1].listing.offers[0].item.amount) > (b[1].listing.offers[0].exchange.amount / b[1].listing.offers[0].item.amount)) ? 1 : 0
        ).map(item => {
          return item[0]
        })
    }
  }))

  return {
    exa: resultByHave[0],
    chaos: resultByHave[1]
  }
}
