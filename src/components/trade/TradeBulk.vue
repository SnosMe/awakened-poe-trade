<template>
  <div v-if="!error" class="layout-column flex-grow">
    <div class="mb-1 flex pl-2 justify-between items-baseline" style="min-height: 22px;">
      <div class="flex items-center text-gray-500">
        <span>Matched:&nbsp;&nbsp;</span>
        <span v-if="!result" class="text-gray-600">...</span>
        <div v-else class="flex items-center">
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'chaos' ? 'transparent' : undefined }"
            @click="selectedCurr = 'chaos'">
            <img alt="chaos" src="https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?scale=1&w=1&h=1" class="trade-bulk-currency-icon">
            <span>{{ result.chaos.total }}</span>
          </button>
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'exa' ? 'transparent' : undefined }"
            @click="selectedCurr = 'exa'">
            <img alt="exa" src="https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?scale=1&w=1&h=1" class="trade-bulk-currency-icon">
            <span>{{ result.exa.total }}</span>
          </button>
          <span>(Online)</span>
        </div>
      </div>
      <div v-if="result">
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
            <th class="trade-table-heading">
              <div class="px-2 flex text-xs" style="line-height: 21px;"><span class="w-8 inline-block text-right -ml-px mr-px">{{ selectedCurr }}</span>&thinsp;/&thinsp;<span class="w-8 inline-block">bulk</span></div>
            </th>
            <th class="trade-table-heading">
              <div class="px-2">Stock</div>
            </th>
            <th class="trade-table-heading">
              <div class="px-2">Fulfill</div>
            </th>
            <th class="w-full trade-table-heading">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">Listed</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll;">
          <template v-for="(result, idx) in selectedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100">&nbsp;</td>
            </tr>
            <tr v-else :key="result.id">
              <td class="px-2">{{ Number((result.exchangeAmount / result.itemAmount).toFixed(4)) }}</td>
              <td class="pl-2 whitespace-no-wrap"><span class="w-8 inline-block text-right">{{ result.exchangeAmount }}</span>&thinsp;/&thinsp;<span class="w-8 inline-block">{{ result.itemAmount }}</span></td>
              <td class="px-2 text-right">{{ result.stock }}</td>
              <td class="px-2 text-right"><i v-if="result.stock < result.itemAmount" class="fas fa-exclamation-triangle mr-1 text-gray-500"></i>{{ Math.floor(result.stock / result.itemAmount) }}</td>
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
import { execBulkSearch } from './pathofexile-bulk'
import { tradeTag } from './common'
import { Leagues } from '../Leagues'

export default {
  props: {
    filters: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      searchId: 0,
      loading: false,
      error: null,
      result: null,
      selectedCurr: 'chaos'
    }
  },
  computed: {
    selectedResults () {
      const arr = Array(20)
      if (!this.result) return arr

      const listed = this.result[this.selectedCurr].listed
      arr.splice(0, listed.length, ...listed)
      return arr
    }
  },
  methods: {
    async execSearch () {
      try {
        this.searchId += 1
        const searchId = this.searchId

        this.loading = true
        this.error = null
        this.result = null

        const result = await execBulkSearch(tradeTag(this.filters))
        if (this.searchId !== searchId) return
        this.result = result
        this.selectedCurr = (result.exa.total > result.chaos.total) ? 'exa' : 'chaos'
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    getRelativeTime (iso) {
      return DateTime.fromISO(iso).toRelative({ style: 'short' })
    },
    openTradeLink () {
      MainProcess.openAppBrowser(`https://www.pathofexile.com/trade/exchange/${Leagues.selected}/${this.result[this.selectedCurr].queryId}`)
    }
  }
}
</script>

<style lang="postcss">
.trade-bulk-currency-icon {
  width: 28px;
  height: 28px;
  margin: -7px;
  margin-right: 2px;
}
</style>
