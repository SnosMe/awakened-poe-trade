import { MainProcess } from '@/ipc/main-process-bindings'
import { selected as league } from '@/web/background/Leagues'
import { SearchResult, Account, getTradeEndpoint, RATE_LIMIT_RULES, adjustRateLimits, tradeTag } from './common'
import { RateLimiter } from './RateLimiter'
import { ItemFilters } from '../filters/interfaces'
import { ParsedItem } from '@/parser'

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

async function requestTradeResultList (body: TradeRequest) {
  await RateLimiter.waitMulti(RATE_LIMIT_RULES.SEARCH)

  const response = await fetch(`${MainProcess.CORS}https://${getTradeEndpoint()}/api/trade/exchange/${league.value}`, {
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

  const response = await fetch(`https://${getTradeEndpoint()}/api/trade/fetch/${resultIds.join(',')}?query=${queryId}&exchange`)
  RATE_LIMIT_RULES.FETCH = adjustRateLimits(RATE_LIMIT_RULES.FETCH, response.headers)
  const data: { result: FetchResult[], error: SearchResult['error'] } = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result
    .filter(result => result != null) // { gone: true }
    .map(result => {
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
      } as PricingResult
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
