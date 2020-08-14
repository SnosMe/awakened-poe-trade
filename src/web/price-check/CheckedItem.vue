<template>
  <div v-if="show" class="p-4 layout-column min-h-0">
    <filter-name
      ref="nameFilter"
      :filters="itemFilters"
      :item="item" />
    <price-prediction v-if="showPredictedPrice" class="mb-4"
      :item="item" />
    <price-trend
      :item="item"
      @filter-item-base="applyItemBaseFilter" />
    <filters-block
      :filters="itemFilters"
      :stats="itemStats"
      :item="item"
      @submit="interactedOnce = true" />
    <trade-listing
      v-if="tradeAPI === 'trade' && interactedOnce"
      ref="tradeService"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item" />
    <trade-bulk
      v-if="tradeAPI === 'bulk' && interactedOnce"
      ref="tradeService"
      :filters="itemFilters"
      :item="item" />
    <div v-if="!interactedOnce" @mouseenter="interactedOnce = true">
      <button class="btn" @click="interactedOnce = true">{{ $t('Search') }}</button>
    </div>
    <stack-value :filters="itemFilters" :item="item"/>
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
import StackValue from './stack-value/StackValue'
import FilterName from './filters/FilterName'
import { CATEGORY_TO_TRADE_ID } from './trade/pathofexile-trade'
import { Config } from '@/web/Config'

export default {
  name: 'CheckedItem',
  components: {
    PricePrediction,
    TradeListing,
    TradeBulk,
    PriceTrend,
    FiltersBlock,
    FilterName,
    StackValue
  },
  created () {
    this.$watch(vm => [vm.item, vm.interactedOnce], (curr, prev) => {
      if (this.interactedOnce === false) return

      this.tradeAPI = apiToSatisfySearch(this.item, this.itemStats)

      // NOTE: child `trade-xxx` component renders/receives props on nextTick
      this.$nextTick(() => {
        if (this.$refs.tradeService) {
          this.$refs.tradeService.execSearch()
        }
      })
    }, { deep: false })

    this.$watch(vm => [vm.item, vm.interactedOnce, vm.itemStats, vm.itemFilters], (curr, prev) => {
      const cItem = curr[0]
      const pItem = prev[0]
      const cIntaracted = curr[1]
      const pIntaracted = prev[1]

      if (cItem === pItem && cIntaracted === true && pIntaracted === true) {
        // force user to press Search button on change
        this.interactedOnce = false
      }
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
      this.interactedOnce = (
        this.item.rarity === ItemRarity.Unique ||
        !CATEGORY_TO_TRADE_ID.has(this.item.category) ||
        Boolean(this.item.isUnidentified) ||
        Boolean(this.item.extra.veiled)
      )
    }
  },
  data () {
    return {
      itemFilters: null,
      itemStats: null,
      interactedOnce: false,
      tradeAPI: 'bulk'
    }
  },
  computed: {
    showPredictedPrice () {
      if (Config.store.language !== 'en') return false

      return this.item.rarity === ItemRarity.Rare &&
        this.item.category !== ItemCategory.Map &&
        this.item.category !== ItemCategory.CapturedBeast &&
        !this.item.isUnidentified
    },
    show () {
      if (!this.item) return false

      return !(this.item.rarity === ItemRarity.Unique &&
        this.item.isUnidentified &&
        this.item.baseType == null)
    }
  },
  methods: {
    async applyItemBaseFilter () {
      for (const stat of this.itemStats) {
        stat.disabled = true
      }
      await this.$nextTick()

      this.itemFilters.itemLevel.disabled = false
      if (this.itemFilters.influences) {
        this.itemFilters.influences[0].disabled = false
      }
      this.$refs.nameFilter.toggleAccuracy()
    }
  }
}
</script>
