<template>
  <div class="layout-column" v-if="item">
    <div class="p-4 layout-column">
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
        v-if="tradeAPI === 'trade'"
        ref="tradeService"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
      <trade-bulk
        v-else-if="tradeAPI === 'bulk'"
        ref="tradeService"
        :filters="itemFilters" />
    </div>
  </div>
</template>

<script>
import { MainProcess } from '@/ipc/main-process-bindings'
import { parseClipboard, ItemRarity, ItemCategory } from '@/parser'
import TradeListing from './trade/TradeListing'
import TradeBulk from './trade/TradeBulk'
import { apiToSatisfySearch } from './trade/common'
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
    TradeBulk,
    PriceTrend,
    FiltersBlock,
    FilterName
  },
  created () {
    MainProcess.addEventListener('price-check', ({ detail: { clipboard } }) => {
      this.item = parseClipboard(clipboard)
      this.itemFilters = createFilters(this.item)
      this.itemStats = initUiModFilters(this.item)
    })

    this.$watch(vm => [vm.itemFilters, vm.itemStats], () => {
      this.tradeAPI = apiToSatisfySearch(this.itemFilters, this.itemStats)

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
      itemStats: null,
      tradeAPI: 'bulk'
    }
  },
  computed: {
    showPredictedPrice () {
      return this.item.rarity === ItemRarity.Rare &&
        this.item.category !== ItemCategory.Map &&
        this.item.category !== ItemCategory.ItemisedMonster &&
        !(this.item.category === ItemCategory.Jewel && this.item.baseType.endsWith(' Cluster Jewel'))
    }
  },
  methods: {
  }
}
</script>
