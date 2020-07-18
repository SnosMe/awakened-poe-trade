import { parseClipboard, ItemRarity, ItemCategory } from '@/parser'
import { MainProcess } from '@/ipc/main-process-bindings'
import { tradeTag, getTradeEndpoint, apiToSatisfySearch } from '@/web/price-check/trade/common'
import { Leagues } from '@/web/price-check/Leagues'
import { requestTradeResultList, requestResults, createTradeRequest } from '@/web/price-check/trade/pathofexile-trade'
import { execBulkSearch } from '@/web/price-check/trade/pathofexile-bulk'
import { createFilters } from '@/web/price-check/filters/create-item-filters'
import { initUiModFilters } from '@/web/price-check/filters/create-stat-filters'
import { TRADE_TAG_BY_NAME, CLIENT_STRINGS as _$ } from '@/assets/data'
import { ItemFilters, StatFilter } from '@/web/price-check/filters/interfaces'
import { ParsedItem } from '@/parser/ParsedItem'

export function openTrade (clipboard: string) {
  // From PriceCheckWindow
  const item = parseClipboard(clipboard)
  if (item === null) return

  const leaguesService = () => Leagues
  leaguesService()

  // From CheckedItem
  const itemFilters = createFilters(item)
  const itemStats = initUiModFilters(item)
  // TODO : interactedOnce Investigation
  //   const intaractedOnce = (
  //     item.rarity === ItemRarity.Unique ||
  //     item.category === undefined ||
  //     !CATEGORY_TO_TRADE_ID.has(item.category) ||
  //     Boolean(item.isUnidentified) ||
  //     Boolean(item.extra.veiled)
  //   )

  const tradeAPI = apiToSatisfySearch(itemFilters, itemStats)

  // From TradeListing
  // TODO : interactedOnce Investigation
  //   if("tradeAPI === 'trade' && intaractedOnce")
  if (tradeAPI === 'trade') {
    return execSearch(itemFilters, itemStats, item)
  }

  // From TradeBulk
  execSearch(itemFilters)
}

async function execSearch (filters: ItemFilters) : Promise<any>;
async function execSearch (filters: ItemFilters, stats: StatFilter[], item: ParsedItem) : Promise<any>;

async function execSearch (filters: ItemFilters, stats?: StatFilter[], item?: ParsedItem) {
  if (stats === undefined || item === undefined) {
    // From TradeBulk
    const tradeTagName = tradeTag(filters)
    if (tradeTagName === undefined) return
    const result = await execBulkSearch(tradeTagName)
    let bulkSearchType = (result.exa.total > result.chaos.total) ? result.exa : result.chaos
    // override, because at league start many players set wrong price, and this breaks auto-detection
    if (tradeTagName === TRADE_TAG_BY_NAME.get('Chaos Orb')) {
      bulkSearchType = result.exa
    } else if (tradeTagName === TRADE_TAG_BY_NAME.get('Exalted Orb')) {
      bulkSearchType = result.chaos
    }
    const link = `https://${getTradeEndpoint()}/trade/exchange/${Leagues.selected}/${bulkSearchType.queryId}`
    MainProcess.openSystemBrowser(link)
    return
  }

  // From TradeListing
  const request = createTradeRequest(filters, stats, item)
  const list = await requestTradeResultList(request, filters.trade.league)
  const link = list
    ? `https://${getTradeEndpoint()}/trade/search/${filters.trade.league}/${list.id}`
    : `https://${getTradeEndpoint()}/trade/search/${filters.trade.league}?q=${JSON.stringify(createTradeRequest(filters, stats, item))}`
  MainProcess.openSystemBrowser(link)
}
