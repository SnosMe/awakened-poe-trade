<template>
  <div v-if="!error" class="layout-column flex-grow min-h-0">
    <div class="mb-2 flex pl-2">
      <div class="flex items-baseline text-gray-500 mr-2">
        <span class="mr-1">{{ $t('Matched:') }}</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? '+' : '' }}</span>
      </div>
      <ui-popper v-if="list" tag-name="div" class="flex min-w-0" :delayOnMouseOver="70" :delayOnMouseOut="150" :options="{ placement: 'bottom-start' }" boundaries-selector="#price-window">
        <template slot="reference">
          <button class="text-gray-500 rounded mr-1 px-2 truncate">
            <span><i class="fas fa-history"></i> {{ $t(filters.trade.offline ? 'Offline' : 'Online') }}</span>
            <span v-if="Leagues.selected !== filters.trade.league">, {{ filters.trade.league }}</span>
          </button>
        </template>
        <div class="popper">
          <div class="p-2 text-left bg-gray-800 text-gray-400">
            <ui-toggle v-model="filters.trade.offline" class="mb-2">{{ $t('Offline & Online') }}</ui-toggle>
            <div class="flex">
              <div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" :value="undefined">{{ $t('Listed: Any Time') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="1day">{{ $t('1 Day Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="3days">{{ $t('3 Days Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="1week">{{ $t('1 Week Ago') }}</ui-radio></div>
                <div class="mb-1"><ui-radio v-model="filters.trade.listed" value="2weeks">{{ $t('2 Weeks Ago') }}</ui-radio></div>
                <div class="mb"><ui-radio v-model="filters.trade.listed" value="1month">{{ $t('1 Month Ago') }}</ui-radio></div>
              </div>
              <div class="ml-8">
                <div class="mb-1" v-for="league of Leagues.tradeLeagues" :key="league.id">
                  <ui-radio v-model="filters.trade.league" :value="league.id">{{ league.id }}</ui-radio>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ui-popper>
      <div class="flex-1"></div>
      <div v-if="list" class="flex">
        <button @click="openTradeLink(false)" class="bg-gray-700 text-gray-400 rounded-l mr-px px-2 leading-none">{{ $t('Trade') }}</button>
        <button @click="openTradeLink(true)" class="bg-gray-700 text-gray-400 rounded-r px-2 leading-none"><i class="fas fa-external-link-alt text-xs"></i></button>
      </div>
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ $t('Price') }}</div>
            </th>
            <th v-if="item.stackSize" class="trade-table-heading">
              <div class="px-2">{{ $t('Stock') }}</div>
            </th>
            <th v-if="filters.itemLevel" class="trade-table-heading">
              <div class="px-2">{{ $t('iLvl') }}</div>
            </th>
            <th v-if="item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ $t('Level') }}</div>
            </th>
            <th v-if="filters.quality || item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ $t('Quality') }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !config.showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ $t('Listed') }}</span>
              </div>
            </th>
            <th v-if="config.showSeller" class="trade-table-heading w-full">
              <div class="px-2">{{ $t('Seller') }}</div>
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
                <span v-if="!config.showSeller && (config.accountName === result.accountName)" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ $t('You') }}</span>
              </td>
              <td v-if="config.showSeller" class="px-2 whitespace-no-wrap">
                <span v-if="config.accountName === result.accountName" class="rounded px-1 text-gray-800 bg-gray-400">{{ $t('You') }}</span>
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
      <span class="text-red-400">{{ $t('Trade site request failed') }}</span>
      <button class="btn ml-2" @click="execSearch">{{ $t('Retry') }}</button>
      <button class="btn ml-1" @click="openTradeLink(false)">{{ $t('Browser') }}</button>
    </div>
    <div>Error: {{ error }}</div>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import { MainProcess } from '@/ipc/main-process-bindings'
import { requestTradeResultList, requestResults, createTradeRequest } from './pathofexile-trade'
import { getTradeEndpoint } from './common'
import { Leagues } from '../Leagues'
import { Config } from '@/web/Config'

const SHOW_RESULTS = 20
const API_FETCH_LIMIT = 100
const MIN_NOT_GROUPED = 7
const MIN_GROUPED = 10

export default {
  props: {
    filters: {
      type: Object,
      required: true
    },
    stats: {
      type: Array,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  inject: ['wm', 'widget'],
  data () {
    return {
      searchId: 0,
      loading: false,
      error: null,
      results: Array(SHOW_RESULTS),
      list: null
    }
  },
  computed: {
    groupedResults () {
      // first req ready
      if (this.results[0] == null) return Array(SHOW_RESULTS)

      const out = []
      for (const result of this.results) {
        // second req ready
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
          existingRes.listedTimes += 1
        } else {
          out.push({ listedTimes: 1, ...result })
        }
      }

      if (out.length < SHOW_RESULTS) {
        out.push(...Array(SHOW_RESULTS - out.length))
      }
      return out
    },
    config () {
      return Config.store
    },
    Leagues () {
      return Leagues.state
    }
  },
  methods: {
    async execSearch () {
      try {
        // NOTE: rate limiting https://www.pathofexile.com/forum/view-thread/2079853#p15244273

        this.searchId += 1
        const searchId = this.searchId

        this.loading = true
        this.error = null
        const resultsVar = Array(SHOW_RESULTS) // keep as local to searchId
        this.results = resultsVar

        this.list = null
        const request = createTradeRequest(this.filters, this.stats, this.item)
        const list = await requestTradeResultList(request, this.filters.trade.league)
        if (this.searchId !== searchId) return
        this.list = list

        // first two req are parallel, then sequential on demand
        await Promise.all([
          (list.total > 0)
            ? requestResults(list.id, list.result.slice(0, 10))
              .then(results => { resultsVar.splice(0, results.length, ...results) })
            : Promise.resolve(),
          (list.total > 10)
            ? requestResults(list.id, list.result.slice(10, 20))
              .then(results => { resultsVar.splice(10, results.length, ...results) })
            : Promise.resolve()
        ])

        let fetched = 20
        const fetchMore = async () => {
          if (this.searchId !== searchId) return

          const totalGrouped = this.groupedResults.reduce((len, res) =>
            res != null ? len + 1 : len, 0)
          const totalNotGrouped = this.groupedResults.reduce((len, res) =>
            res != null && res.listedTimes <= 2 ? len + 1 : len, 0)

          if (
            (totalNotGrouped < MIN_NOT_GROUPED || totalGrouped < MIN_GROUPED) &&
            fetched < list.total &&
            fetched < API_FETCH_LIMIT
          ) {
            await requestResults(list.id, list.result.slice(fetched, fetched + 10))
              .then(results => { resultsVar.push(...results) })

            fetched += 10
            return fetchMore()
          }
        }
        return fetchMore()
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    getRelativeTime (iso) {
      return DateTime.fromISO(iso).toRelative({ style: 'short' })
    },
    openTradeLink (isExternal) {
      const link = this.list
        ? `https://${getTradeEndpoint()}/trade/search/${this.filters.trade.league}/${this.list.id}`
        : `https://${getTradeEndpoint()}/trade/search/${this.filters.trade.league}?q=${JSON.stringify(createTradeRequest(this.filters, this.stats, this.item))}`

      if (isExternal) {
        MainProcess.openSystemBrowser(link)
      } else {
        this.wm.showBrowser(this.widget.config.wmId, link)
      }
    }
  }
}
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
