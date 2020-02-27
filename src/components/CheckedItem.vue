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
import { createFilters } from './filters/create-item-filters'
import { initUiModFilters } from './filters/create-stat-filters'
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
      this.item = parseClipboard(clipboard)
      this.itemFilters = createFilters(this.item)
      this.itemStats = initUiModFilters(this.item)
    })

    document.addEventListener('mouseenter', (e) => {
      if (e.ctrlKey) {
        MainProcess.lockWindow()
      }
    })
    document.addEventListener('click', () => { MainProcess.priceCheckMouse('click') })
    document.addEventListener('mouseleave', () => { MainProcess.priceCheckMouse('leave') })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        MainProcess.priceCheckHide()
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
