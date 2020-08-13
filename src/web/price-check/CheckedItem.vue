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
      @submit="intaractedOnce = true" />
    <trade-listing
      v-if="tradeAPI === 'trade' && intaractedOnce"
      ref="tradeService"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item" />
    <div v-if="tradeAPI === 'trade' && !intaractedOnce">
      <button class="btn" @click="intaractedOnce = true">{{ $t('Search') }}</button>
    </div>
    <trade-bulk
      v-if="tradeAPI === 'bulk'"
      ref="tradeService"
      :filters="itemFilters"
      :item="item" />
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
import { Config } from '@/web/Config'

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
      this.tradeAPI = apiToSatisfySearch(this.item, this.itemStats)

      if (this.intaractedOnce === false) return

      // NOTE: children component receives props on nextTick
      this.$nextTick(() => {
        if (this.$refs.tradeService) {
          this.$refs.tradeService.execSearch()
        }
      })
    }, { deep: true })

    this.$watch(vm => [vm.itemStats, vm.intaractedOnce], (curr, prev) => {
      const cItem = curr[0]
      const pItem = prev[0]
      const cIntaracted = curr[1]
      const pIntaracted = prev[1]

      if (cItem === pItem && cIntaracted === true && pIntaracted === true) {
        // force user to press Search button on change
        this.intaractedOnce = false
      }
    }, { deep: true })

    this.$watch(vm => [vm.itemFilters, vm.intaractedOnce], (curr, prev) => {
      const cItem = curr[0]
      const pItem = prev[0]
      const cIntaracted = curr[1]
      const pIntaracted = prev[1]
      if (cItem === pItem && cIntaracted === false && pIntaracted === false) {
        this.intaractedOnce = true
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
      this.intaractedOnce = (
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
      intaractedOnce: false,
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
