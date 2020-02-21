<template>
  <div class="bg-gray-800 text-gray-200 layout-column" v-if="item">
    <div class="p-4 border-b border-gray-700 layout-column">
      <filter-name
        :filters="itemFilters"
        :item="item" />
      <price-prediction v-if="showPredictedPrice" class="mb-4"
        :item="item" />
      <price-trend
        :item="item" />
      <filters-block v-if="!item.stackSize"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
      <trade-listing
        ref="tradeService"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
    </div>
  </div>
</template>

<script>
import { MainProcess } from './main-process-bindings'
import { parseClipboard, ItemRarity, ItemCategory } from './parser'
import TradeListing from './trade/TradeListing'
import PriceTrend from './trends/PriceTrend'
import FiltersBlock from './filters/FiltersBlock'
import { createFilters } from './filters/create'
import { initUiModFilters } from './trade/interfaces'
import PricePrediction from './price-prediction/PricePrediction'
import FilterName from './filters/FilterName'

export default {
  name: 'CheckedItem',
  components: {
    PricePrediction,
    TradeListing,
    PriceTrend,
    FiltersBlock,
    FilterName
  },
  created () {
    MainProcess.addEventListener('price-check', ({ detail: clipboard }) => {
      const item = parseClipboard(clipboard)
      if (item != null) {
        this.item = item
        this.itemFilters = createFilters(item)
        this.itemStats = initUiModFilters(item)
        MainProcess.priceCheckVisible(true)
      }
    })

    document.addEventListener('mouseenter', (e) => {
      if (e.ctrlKey) {
        this.isClickedAfterLock = false
        MainProcess.lockWindow()
      }
    })
    document.addEventListener('click', () => {
      this.isClickedAfterLock = true
    })
    document.addEventListener('mouseleave', () => {
      if (!this.isClickedAfterLock) {
        MainProcess.priceCheckVisible(false)
      }
    })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        MainProcess.priceCheckVisible(false)
      }
    })

    this.$watch(vm => [vm.itemFilters, vm.itemStats], () => {
      // NOTE: children component receives props on nextTick
      this.$nextTick(() => {
        this.$refs.tradeService.execSearch()
      })
    }, { deep: true })
  },
  data () {
    return {
      isClickedAfterLock: false,
      item: null,
      itemFilters: null,
      itemStats: null
    }
  },
  computed: {
    showPredictedPrice () {
      return this.item.rarity === ItemRarity.Rare &&
        this.item.category !== ItemCategory.Map &&
        this.item.category !== ItemCategory.ItemisedMonster
    }
  },
  methods: {
  }
}
</script>
