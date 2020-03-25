<template>
  <div class="layout-column" v-if="item">
    <div class="p-4 layout-column">
      <filter-name
        ref="nameFilter"
        :filters="itemFilters"
        :item="item" />
      <price-prediction v-if="showPredictedPrice" class="mb-4"
        :item="item" />
      <price-trend
        :item="item"
        @filter-item-base="applyItemBaseFilter" />
      <filters-block v-if="!item.stackSize"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
      <trade-listing
        v-if="tradeAPI === 'trade' && intaractedOnce"
        ref="tradeService"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
      <div v-if="tradeAPI === 'trade' && !intaractedOnce">
        <button class="btn" @click="intaractedOnce = true">Search</button>
      </div>
      <trade-bulk
        v-if="tradeAPI === 'bulk'"
        ref="tradeService"
        :filters="itemFilters" />
    </div>
  </div>
</template>

<script>
import { ItemRarity, ItemCategory } from '@/parser'
import TradeListing from './trade/TradeListing'
import TradeBulk from './trade/TradeBulk'
import { apiToSatisfySearch } from './trade/common'
import PriceTrend from './trends/PriceTrend'
import FiltersBlock from './filters/FiltersBlock'
import { createFilters } from './filters/create-item-filters'
import { initUiModFilters } from './filters/create-stat-filters'
import PricePrediction from './price-prediction/PricePrediction'
import FilterName from './filters/FilterName'
import { CATEGORY_TO_TRADE_ID } from './trade/pathofexile-trade'

export default {
  name: 'CheckedItem',
  components: {
    PricePrediction,
    TradeListing,
    TradeBulk,
    PriceTrend,
    FiltersBlock,
    FilterName
  },
  created () {
    this.$watch(vm => [vm.itemFilters, vm.itemStats, vm.intaractedOnce], (curr, prev) => {
      this.tradeAPI = apiToSatisfySearch(this.itemFilters, this.itemStats)

      const cItem = curr[0]
      const pItem = prev[0]
      const cIntaracted = curr[2]
      if (cItem === pItem && cIntaracted === false) {
        // In that case, the change is either in itemFilters or itemStats, and this counts as an interaction
        this.intaractedOnce = true
        return
      }

      // NOTE: children component receives props on nextTick
      this.$nextTick(() => {
        this.$refs.tradeService.execSearch()
      })
    }, { deep: true })
  },
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  watch: {
    item (item) {
      this.itemFilters = createFilters(item)
      this.itemStats = initUiModFilters(item)
      this.intaractedOnce = (
        this.item.rarity === ItemRarity.Unique ||
        !CATEGORY_TO_TRADE_ID.has(this.item.category)
      )
    }
  },
  data () {
    return {
      itemFilters: null,
      itemStats: null,
      intaractedOnce: false,
      tradeAPI: 'bulk'
    }
  },
  computed: {
    showPredictedPrice () {
      return this.item.rarity === ItemRarity.Rare &&
        this.item.category !== ItemCategory.Map &&
        this.item.category !== ItemCategory.CapturedBeast
    }
  },
  methods: {
    applyItemBaseFilter () {
      for (const stat of this.itemStats) {
        stat.disabled = true
      }
      this.itemFilters.itemLevel.disabled = false
      if (this.itemFilters.influences) {
        this.itemFilters.influences[0].disabled = false
      }
      this.$refs.nameFilter.toggleAccuracy()
    }
  }
}
</script>
