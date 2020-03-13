<template>
  <div v-if="!error" class="layout-column flex-grow min-h-0">
    <div class="mb-1 flex pl-2 justify-between">
      <div class="flex items-baseline text-gray-500">
        <span class="mr-1">Matched:</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? '+' : '' }} (Online)</span>
      </div>
      <div v-if="list">
        <button @click="openTradeLink" class="py-1 -my-1 px-2 leading-none align-left"><span class="mr-1">Trade</span><i class="fas fa-external-link-alt"></i></button>
      </div>
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">Price</div>
            </th>
            <th v-if="item.stackSize" class="trade-table-heading">
              <div class="px-2">Stock</div>
            </th>
            <th v-if="filters.itemLevel" class="trade-table-heading">
              <div class="px-2">iLvl</div>
            </th>
            <th v-if="item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">Level</div>
            </th>
            <th v-if="filters.quality || item.rarity === 'Gem'" class="trade-table-heading">
              <div class="px-2">Quality</div>
            </th>
            <th class="w-full trade-table-heading">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">Listed</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll;">
          <template v-for="(result, idx) in grouppedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <tr v-else :key="result.id">
              <td class="px-2 whitespace-no-wrap">{{ result.priceAmount }} {{ result.priceCurrency }} <span v-if="result.listedTimes > 2" class="rounded px-1 text-gray-800 bg-gray-400 -mr-2">× {{ result.listedTimes }}</span></td>
              <td v-if="item.stackSize" class="px-2 text-right">{{ result.stackSize }}</td>
              <td v-if="filters.itemLevel" class="px-2 whitespace-no-wrap text-right">{{ result.itemLevel }}</td>
              <td v-if="item.rarity === 'Gem'" class="px-2 whitespace-no-wrap">{{ result.level }}</td>
              <td v-if="filters.quality || item.rarity === 'Gem'" class="px-2 whitespace-no-wrap text-blue-400 text-right">{{ result.quality }}</td>
              <td class="font-sans text-xs pr-2 pl-4">
                <div class="flex items-center">
                  <div class="account-status" :class="result.accountStatus"></div>
                  <div class="ml-1">{{ getRelativeTime(result.listedAt) }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>
    <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
    <span>{{ error }}</span>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import { MainProcess } from '../main-process-bindings'
import { requestTradeResultList, requestResults, createTradeRequest } from './pathofexile-trade'
import { Leagues } from '../Leagues'

const SHOW_RESULTS = 20
const API_FETCH_LIMIT = 100

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
    grouppedResults () {
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

        const prevRes = out[out.length - 1]
        if (
          prevRes.priceAmount === result.priceAmount &&
          prevRes.priceCurrency === result.priceCurrency &&
          prevRes.accountName === result.accountName
        ) {
          prevRes.listedTimes += 1
        } else {
          out.push({ listedTimes: 1, ...result })
        }
      }

      if (out.length < SHOW_RESULTS) {
        out.push(...Array(SHOW_RESULTS - out.length))
      }
      return out
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
        const request = createTradeRequest(this.filters, this.stats)
        const list = await requestTradeResultList(request)
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

          const totalGroupped = this.grouppedResults.reduce((len, res) => res != null ? len + 1 : len, 0)
          if (
            totalGroupped < SHOW_RESULTS &&
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
    openTradeLink (e) {
      const link = `https://www.pathofexile.com/trade/search/${Leagues.selected}/${this.list.id}`
      if (e.ctrlKey) {
        MainProcess.openUserBrowser(link)
      } else {
        MainProcess.openAppBrowser(link)
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
