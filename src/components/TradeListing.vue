<template>
  <div v-if="loading">
    <i class="fas fa-exclamation-circle pr-1 text-gray-600"></i>
    <span>Requesting search results...</span>
  </div>
  <table v-else-if="results" class="table-stripped w-full">
    <thead>
      <tr class="text-left">
        <th class="px-2">Price</th>
        <th v-if="item.rarity === 'Gem'" class="px-2">Level</th>
        <th v-if="item.rarity === 'Gem'" class="px-2">Quality</th>
        <th class="px-2"></th>
        <th class="px-2 w-full">Listed</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="result in results" :key="result.id">
        <td class="px-2 whitespace-no-wrap">{{ result.priceAmount }} {{ result.priceCurrency }}</td>
        <td v-if="item.rarity === 'Gem'" class="px-2 whitespace-no-wrap">{{ result.level }}</td>
        <td v-if="item.rarity === 'Gem'" class="px-2 whitespace-no-wrap text-blue-400 text-right">{{ result.quality }}</td>
        <td class="px-2 whitespace-no-wrap text-red-500"><span v-if="result.corrupted">Corrupted</span></td>
        <td class="font-sans text-xs px-2">{{ getRelativeTime(result.listedAt) }}</td>
      </tr>
    </tbody>
  </table>
  <div v-else-if="error">
    <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
    <span>{{ error }}</span>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import { requestTradeResultList, requestResults } from './pathofexile-trade'

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
      results: null
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
          const list = await requestTradeResultList(item)
          this.results = await requestResults(list.id, list.result.slice(0, 10))
          this.loading = false

          if (list.total > 10) {
            this.results.push(...await requestResults(list.id, list.result.slice(10, 20)))
          }
        } catch (err) {
          this.error = err.message
        } finally {
          this.loading = false
        }
      }
    }
  },
  methods: {
    getRelativeTime (iso) {
      return DateTime.fromISO(iso).toRelative()
    }
  }
}
</script>
