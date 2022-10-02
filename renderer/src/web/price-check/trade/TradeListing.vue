<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto;">
    <div class="mb-2 flex pl-2">
      <div class="flex items-baseline text-gray-500 mr-2">
        <span class="mr-1">{{ t('Matched:') }}</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? '+' : '' }}</span>
      </div>
      <online-filter v-if="list" :by-time="true" :filters="filters" />
      <div class="flex-1"></div>
      <trade-links v-if="list"
        :get-link="makeTradeLink" />
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ t('Price') }}</div>
            </th>
            <th v-if="item.stackSize" class="trade-table-heading">
              <div class="px-2">{{ t('Stock') }}</div>
            </th>
            <th v-if="filters.itemLevel" class="trade-table-heading">
              <div class="px-2">{{ t('iLvl') }}</div>
            </th>
            <th v-if="item.category === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t('Level') }}</div>
            </th>
            <th v-if="filters.quality || item.category === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t('Quality') }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ t('Listed') }}</span>
              </div>
            </th>
            <th v-if="showSeller" class="trade-table-heading w-full">
              <div class="px-2">{{ t('Seller') }}</div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll;">
          <template v-for="(result, idx) in groupedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <tr v-else :key="result.id">
              <td class="px-2 whitespace-nowrap">{{ result.priceAmount }} {{ result.priceCurrency }} <span v-if="result.listedTimes > 2" class="rounded px-1 text-gray-800 bg-gray-400 -mr-2"><span class="font-sans">×</span> {{ result.listedTimes }}</span><i v-else-if="!result.hasNote" class="fas fa-question" /></td>
              <td v-if="item.stackSize" class="px-2 text-right">{{ result.stackSize }}</td>
              <td v-if="filters.itemLevel" class="px-2 whitespace-nowrap text-right">{{ result.itemLevel }}</td>
              <td v-if="item.category === 'Gem'" class="pl-2 whitespace-nowrap">{{ result.level }}</td>
              <td v-if="filters.quality || item.category === 'Gem'" class="px-2 whitespace-nowrap text-blue-400 text-right">{{ result.quality }}</td>
              <td class="pr-2 pl-4 whitespace-nowrap">
                <div class="inline-flex items-center">
                  <div class="account-status" :class="result.accountStatus"></div>
                  <div class="ml-1 font-sans text-xs">{{ result.relativeDate }}</div>
                </div>
                <span v-if="!showSeller && result.isMine" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
              </td>
              <td v-if="showSeller" class="px-2 whitespace-nowrap">
                <span v-if="result.isMine" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
                <span v-else class="font-sans text-xs">{{ showSeller === 'ign' ? result.ign : result.accountName }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <ui-error-box v-else>
    <template #name>{{ t('Trade site request failed') }}</template>
    <p>Error: {{ error }}</p>
    <template #actions>
      <button class="btn" @click="execSearch">{{ t('Retry') }}</button>
      <button class="btn" @click="openTradeLink">{{ t('Browser') }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import { defineComponent, computed, watch, PropType, inject, shallowReactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { requestTradeResultList, requestResults, createTradeRequest, PricingResult, SearchResult } from './pathofexile-trade'
import { getTradeEndpoint } from './common'
import { AppConfig } from '@/web/Config'
import { PriceCheckWidget } from '@/web/overlay/interfaces'
import { ItemFilters, StatFilter } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { artificialSlowdown } from './artificial-slowdown'
import OnlineFilter from './OnlineFilter.vue'
import TradeLinks from './TradeLinks.vue'

const slowdown = artificialSlowdown(900)

const SHOW_RESULTS = 20
const API_FETCH_LIMIT = 100
const MIN_NOT_GROUPED = 7
const MIN_GROUPED = 10

function useTradeApi () {
  let searchId = 0
  const error = shallowRef<string | null>(null)
  const searchResult = shallowRef<SearchResult | null>(null)
  const fetchResults = shallowRef<PricingResult[]>([])

  const groupedResults = computed(() => {
    const out: Array<PricingResult & { listedTimes: number }> = []
    for (const result of fetchResults.value) {
      if (result == null) break
      if (out.length === 0) {
        out.push({ listedTimes: 1, ...result })
        continue
      }
      const existingRes = out.find((added, idx) =>
        (
          added.accountName === result.accountName &&
          added.priceCurrency === result.priceCurrency &&
          added.priceAmount === result.priceAmount
        ) ||
        (
          added.accountName === result.accountName &&
          (out.length - idx) <= 2 // last or prev
        )
      )
      if (existingRes) {
        if (existingRes.stackSize) {
          existingRes.stackSize += result.stackSize!
        } else {
          existingRes.listedTimes += 1
        }
      } else {
        out.push({ listedTimes: 1, ...result })
      }
    }
    return out
  })

  async function search (filters: ItemFilters, stats: StatFilter[], item: ParsedItem) {
    try {
      searchId += 1
      error.value = null
      searchResult.value = null
      const _fetchResults: PricingResult[] = shallowReactive([])
      fetchResults.value = _fetchResults

      const _searchId = searchId
      const request = createTradeRequest(filters, stats, item)
      const _searchResult = await requestTradeResultList(request, filters.trade.league)
      if (_searchId !== searchId) {
        return
      }
      searchResult.value = _searchResult

      // first two req are parallel, then sequential on demand
      {
        const r1 = (_searchResult.result.length > 0)
          ? requestResults(_searchResult.id, _searchResult.result.slice(0, 10), { accountName: AppConfig().accountName })
            .then(results => { _fetchResults.push(...results) })
          : Promise.resolve()
        const r2 = (_searchResult.result.length > 10)
          ? requestResults(_searchResult.id, _searchResult.result.slice(10, 20), { accountName: AppConfig().accountName })
            .then(results => r1
              .then(() => { _fetchResults.push(...results) }))
          : Promise.resolve()
        await Promise.all([r1, r2])
      }

      let fetched = 20
      async function fetchMore (): Promise<void> {
        if (_searchId !== searchId) return
        const totalGrouped = groupedResults.value.length
        const totalNotGrouped = groupedResults.value.reduce((len, res) =>
          res.listedTimes <= 2 ? len + 1 : len, 0)
        if (
          (totalNotGrouped < MIN_NOT_GROUPED || totalGrouped < MIN_GROUPED) &&
          fetched < _searchResult.result.length &&
          fetched < API_FETCH_LIMIT
        ) {
          await requestResults(_searchResult.id, _searchResult.result.slice(fetched, fetched + 10), { accountName: AppConfig().accountName })
            .then(results => { _fetchResults.push(...results) })
          fetched += 10
          return fetchMore()
        }
      }
      return fetchMore()
    } catch (err) {
      error.value = (err as Error).message
    }
  }

  return { error, searchResult, groupedResults, search }
}

export default defineComponent({
  components: { OnlineFilter, TradeLinks },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const widget = computed(() => AppConfig<PriceCheckWidget>('price-check')!)

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const { error, searchResult, groupedResults, search } = useTradeApi()

    const showBrowser = inject<(url: string) => void>('builtin-browser')!

    function makeTradeLink () {
      return (searchResult.value)
        ? `https://${getTradeEndpoint()}/trade/search/${props.filters.trade.league}/${searchResult.value.id}`
        : `https://${getTradeEndpoint()}/trade/search/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item))}`
    }

    const { t } = useI18n()

    return {
      t,
      list: searchResult,
      groupedResults: computed(() => {
        if (!slowdown.isReady.value) {
          return Array<undefined>(SHOW_RESULTS)
        } else {
          return [
            ...groupedResults.value,
            ...(groupedResults.value.length < SHOW_RESULTS
              ? Array<undefined>(SHOW_RESULTS - groupedResults.value.length)
              : [])
          ]
        }
      }),
      execSearch: () => { search(props.filters, props.stats, props.item) },
      error,
      showSeller: computed(() => widget.value.showSeller),
      makeTradeLink,
      openTradeLink () {
        showBrowser(makeTradeLink())
      }
    }
  }
})
</script>

<style lang="postcss">
.trade-table-heading {
  @apply sticky top-0;
  @apply bg-gray-800;
  @apply p-0 m-0;

  & > div {
    @apply border-b border-gray-700;
  }
}

.account-status {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  &.online { /* */ }
  &.offline {
    @apply bg-red-600;
  }
  &.afk {
    @apply bg-orange-500;
  }
}
</style>

<i18n>
{
  "ru": {
    "Matched:": "Найдено:",
    "Trade": "Трейд",
    "Price": "Цена",
    "Stock": "Запас",
    "iLvl": "Ур.",
    "Level": "Уровень",
    "Quality": "К-во",
    "Listed": "Выставлен",
    "Seller": "Продавец",
    "Trade site request failed": "Запрос к сайту не удался"
  },
  "zh_CN": {
    "Matched:": "已匹配:",
    "Trade": "交易",
    "Price": "价格",
    "Stock": "存量",
    "iLvl": "物等",
    "Level": "等级",
    "Quality": "品质",
    "Listed": "已列出",
    "Seller": "卖家",
    "Trade site request failed": "交易站点请求失败"
  },
  "cmn-Hant": {
    "Matched:": "已匹配:",
    "Trade": "交易",
    "Price": "價格",
    "Stock": "存量",
    "iLvl": "物等",
    "Level": "等級",
    "Quality": "品質",
    "Listed": "已列出",
    "Seller": "賣家",
    "Trade site request failed": "交易站點請求失敗"
  }
}
</i18n>
