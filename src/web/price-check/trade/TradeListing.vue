<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto;">
    <div class="mb-2 flex pl-2">
      <div class="flex items-baseline text-gray-500 mr-2">
        <span class="mr-1">{{ t('Matched:') }}</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? '+' : '' }}</span>
      </div>
      <ui-popover v-if="list" :delay="[80, null]" placement="bottom-start" boundary="#price-window">
        <template #target>
          <button class="text-gray-500 rounded mr-1 px-2 truncate">
            <span><i class="fas fa-history"></i> {{ t(filters.trade.offline ? 'Offline' : 'Online') }}</span>
            <span v-if="defaultLeague !== filters.trade.league">, {{ filters.trade.league }}</span>
          </button>
        </template>
        <template #content>
          <div class="p-2 bg-gray-800 text-gray-400">
            <ui-toggle v-model="filters.trade.offline" class="mb-2">{{ t('Offline & Online') }}</ui-toggle>
            <div class="flex">
              <div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" :value="undefined">{{ t('Listed: Any Time') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="1day">{{ t('1 Day Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="3days">{{ t('3 Days Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="1week">{{ t('1 Week Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="2weeks">{{ t('2 Weeks Ago') }}</ui-radio></div>
                <div class="mb"><ui-radio v-model="filters.trade.listed" value="1month">{{ t('1 Month Ago') }}</ui-radio></div>
              </div>
              <div class="ml-8">
                <div class="mb-1" v-for="league of tradeLeagues" :key="league.id">
                  <ui-radio v-model="filters.trade.league" :value="league.id">{{ league.id }}</ui-radio>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ui-popover>
      <div class="flex-1"></div>
      <div v-if="list" class="flex">
        <button @click="openTradeLink(false)" class="bg-gray-700 text-gray-400 rounded-l mr-px px-2 leading-none">{{ t('Trade') }}</button>
        <button @click="openTradeLink(true)" class="bg-gray-700 text-gray-400 rounded-r px-2 leading-none"><i class="fas fa-external-link-alt text-xs"></i></button>
      </div>
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
            <th v-if="item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t('Level') }}</div>
            </th>
            <th v-if="filters.quality || item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t('Quality') }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !config.showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ t('Listed') }}</span>
              </div>
            </th>
            <th v-if="config.showSeller" class="trade-table-heading w-full">
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
              <td class="px-2 whitespace-no-wrap">{{ result.priceAmount }} {{ result.priceCurrency }} <span v-if="result.listedTimes > 2" class="rounded px-1 text-gray-800 bg-gray-400 -mr-2"><span class="font-sans">×</span> {{ result.listedTimes }}</span></td>
              <td v-if="item.stackSize" class="px-2 text-right">{{ result.stackSize }}</td>
              <td v-if="filters.itemLevel" class="px-2 whitespace-no-wrap text-right">{{ result.itemLevel }}</td>
              <td v-if="item.rarity === 'Gem'" class="pl-2 whitespace-no-wrap">{{ result.level }}</td>
              <td v-if="filters.quality || item.rarity === 'Gem'" class="px-2 whitespace-no-wrap text-blue-400 text-right">{{ result.quality }}</td>
              <td class="pr-2 pl-4 whitespace-no-wrap">
                <div class="inline-flex items-center">
                  <div class="account-status" :class="result.accountStatus"></div>
                  <div class="ml-1 font-sans text-xs">{{ getRelativeTime(result.listedAt) }}</div>
                </div>
                <span v-if="!config.showSeller && (config.accountName === result.accountName)" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
              </td>
              <td v-if="config.showSeller" class="px-2 whitespace-no-wrap">
                <span v-if="config.accountName === result.accountName" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
                <span v-else class="font-sans text-xs">{{ config.showSeller === 'ign' ? result.ign : result.accountName }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>
    <div>
      <span class="text-red-400">{{ t('Trade site request failed') }}</span>
      <button class="btn ml-2" @click="execSearch">{{ t('Retry') }}</button>
      <button class="btn ml-1" @click="openTradeLink(false)">{{ t('Browser') }}</button>
    </div>
    <div>Error: {{ error }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, PropType, inject, shallowReactive, shallowRef, ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { MainProcess } from '@/ipc/main-process-bindings'
import { requestTradeResultList, requestResults, createTradeRequest, PricingResult } from './pathofexile-trade'
import { getTradeEndpoint, SearchResult } from './common'
import { selected as defaultLeague, tradeLeagues } from '../../background/Leagues'
import { Config } from '@/web/Config'
import { PriceCheckWidget, WidgetManager } from '@/web/overlay/interfaces'
import { ItemFilters, StatFilter } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { artificialSlowdown } from './artificial-slowdown'

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
          ? requestResults(_searchResult.id, _searchResult.result.slice(0, 10))
            .then(results => { _fetchResults.push(...results) })
          : Promise.resolve()
        const r2 = (_searchResult.result.length > 10)
          ? requestResults(_searchResult.id, _searchResult.result.slice(10, 20))
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
          fetched < _searchResult.total &&
          fetched < API_FETCH_LIMIT
        ) {
          await requestResults(_searchResult.id, _searchResult.result.slice(fetched, fetched + 10))
            .then(results => { _fetchResults.push(...results) })
          fetched += 10
          return fetchMore()
        }
      }
      return fetchMore()
    } catch (err) {
      error.value = err.message
    }
  }

  return { error, searchResult, groupedResults, search }
}

export default defineComponent({
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
    const wm = inject<WidgetManager>('wm')!
    const widget = inject<{ config: ComputedRef<PriceCheckWidget> }>('widget')!

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const { error, searchResult, groupedResults, search } = useTradeApi()

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
      config: computed(() => Config.store),
      defaultLeague,
      tradeLeagues,
      getRelativeTime (iso: string) {
        return DateTime.fromISO(iso).toRelative({ style: 'short' })
      },
      openTradeLink (isExternal: boolean) {
        const link = searchResult.value
          ? `https://${getTradeEndpoint()}/trade/search/${props.filters.trade.league}/${searchResult.value.id}`
          : `https://${getTradeEndpoint()}/trade/search/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item))}`

        if (isExternal) {
          MainProcess.openSystemBrowser(link)
        } else {
          wm.showBrowser(widget.config.value.wmId, link)
        }
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
    "Offline & Online": "Офлайн и Онлайн",
    "Listed: Any Time": "Любое время",
    "1 Day Ago": "До 1-го дня",
    "3 Days Ago": "До 3-х дней",
    "1 Week Ago": "До 1-й недели",
    "2 Weeks Ago": "До 2-х недель",
    "1 Month Ago": "До 1-го месяца",
    "Trade": "Трейд",
    "Price": "Цена",
    "Stock": "Запас",
    "iLvl": "Ур.",
    "Level": "Уровень",
    "Quality": "К-во",
    "Listed": "Выставлен",
    "Seller": "Продавец",
    "Trade site request failed": "Запрос к сайту не удался"
  }
}
</i18n>
