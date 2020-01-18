<template>
  <div v-if="loading">
    <i class="fas fa-exclamation-circle pr-1 text-gray-600"></i>
    <span>Requesting search results...</span>
  </div>
  <div v-else-if="results" class="layout-column overflow-y-auto overflow-x-hidden">
    <div v-if="!item.stackSize" class="flex flex-wrap items-center mb-2 -m-1">
      <div v-if="socket_filters.links.min" class="trade-tag">Links: {{ socket_filters.links.min }}</div>
      <div v-if="map_filters.map_tier.min" class="trade-tag">Map Tier: {{ map_filters.map_tier.min }}</div>
      <div v-if="misc_filters.ilvl.min" class="trade-tag">Item Level: {{ misc_filters.ilvl.min }}</div>
      <div v-if="misc_filters.gem_level.min" class="trade-tag">Level: {{ misc_filters.gem_level.min }}</div>
      <div v-if="misc_filters.quality.min" class="trade-tag">Quality: {{ misc_filters.quality.min }}%</div>
      <div v-if="misc_filters.shaper_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Shaper.png">
        <span class="ml-2">Shaper</span>
      </div>
      <div v-if="misc_filters.elder_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Elder.png">
        <span class="ml-2">Elder</span>
      </div>
      <div v-if="misc_filters.crusader_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Crusader.png">
        <span class="ml-2">Crusader</span>
      </div>
      <div v-if="misc_filters.hunter_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Hunter.png">
        <span class="ml-2">Hunter</span>
      </div>
      <div v-if="misc_filters.redeemer_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Redeemer.png">
        <span class="ml-2">Redeemer</span>
      </div>
      <div v-if="misc_filters.warlord_item.option === 'true'" class="trade-tag flex items-center">
        <img class="w-5 h-5 -m-1" src="@/assets/influence/Warlord.png">
        <span class="ml-2">Warlord</span>
      </div>
      <div v-if="misc_filters.corrupted.option" class="trade-tag">
        <span v-if="misc_filters.corrupted.option === 'true'" class="text-red-500">Corrupted</span>
        <span v-if="misc_filters.corrupted.option === 'false'">Not Corrupted</span>
      </div>
      <div class="m-1 flex-1 flex justify-end">
        <button @click="openTradeLink" class="py-1 px-2 leading-none align-left"><i class="fas fa-external-link-alt"></i></button>
      </div>
    </div>
    <!-- @TODO: use css grids to achieve sticky header row -->
    <table class="table-stripped w-full">
      <thead>
        <tr class="text-left">
          <th class="px-2">Price</th>
          <th v-if="item.stackSize" class="px-2">Stock</th>
          <th v-if="misc_filters.ilvl.min" class="px-2">iLvl</th>
          <th v-if="item.rarity === 'Gem'" class="px-2">Level</th>
          <th v-if="item.rarity === 'Gem'" class="px-2">Quality</th>
          <th class="px-2 w-full">Listed</th>
        </tr>
      </thead>
      <tbody style="overflow: scroll;">
        <tr v-for="result in results" :key="result.id">
          <td class="px-2 whitespace-no-wrap">{{ result.priceAmount }} {{ result.priceCurrency }}</td>
          <td v-if="item.stackSize" class="px-2 text-right">{{ result.stackSize }}</td>
          <td v-if="misc_filters.ilvl.min" class="px-2 whitespace-no-wrap text-right">{{ result.itemLevel }}</td>
          <td v-if="item.rarity === 'Gem'" class="px-2 whitespace-no-wrap">{{ result.level }}</td>
          <td v-if="item.rarity === 'Gem'" class="px-2 whitespace-no-wrap text-blue-400 text-right">{{ result.quality }}</td>
          <td class="font-sans text-xs px-2">{{ getRelativeTime(result.listedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else-if="error">
    <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
    <span>{{ error }}</span>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { DateTime } from 'luxon'
import { requestTradeResultList, requestResults, createTradeRequest } from './pathofexile-trade'
import { OPEN_LINK } from '../shared/ipc-event'
import { Leagues } from './Leagues'

export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      loading: false,
      error: null,
      results: null,
      request: null,
      tradeId: null
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler (item) {
        try {
          // @TODO https://www.pathofexile.com/forum/view-thread/2079853#p15244273

          this.loading = true
          this.results = []
          const request = createTradeRequest(item)
          this.request = request
          const list = await requestTradeResultList(request)
          this.tradeId = list.id

          await Promise.all([
            requestResults(list.id, list.result.slice(0, 10))
              .then(results => {
                if (this.results.length) {
                  // if second request loaded faster
                  this.results = [...results, ...this.results]
                } else {
                  this.results = results
                }
                this.loading = false
              }),
            (list.total > 10)
              ? requestResults(list.id, list.result.slice(10, 20))
                .then(results => { this.results.push(...results) })
              : Promise.resolve()
          ])
        } catch (err) {
          this.error = err.message
        } finally {
          this.loading = false
        }
      }
    }
  },
  computed: {
    map_filters () {
      return this.request.query.filters.map_filters.filters
    },
    misc_filters () {
      return this.request.query.filters.misc_filters.filters
    },
    socket_filters () {
      return this.request.query.filters.socket_filters.filters
    }
  },
  methods: {
    getRelativeTime (iso) {
      return DateTime.fromISO(iso).toRelative({ style: 'short' })
    },
    openTradeLink () {
      ipcRenderer.send(OPEN_LINK, `https://www.pathofexile.com/trade/search/${Leagues.selected}/${this.tradeId}`)
    }
  }
}
</script>

<style lang="postcss">
.trade-tag {
  @apply bg-gray-900 py-1 px-2 m-1 rounded-full leading-none;
}
</style>
