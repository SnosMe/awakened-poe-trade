<template>
  <div class="bg-gray-800 text-gray-200 layout-column" v-if="item">
    <div class="p-4 border-b border-gray-700 layout-column">
      <filter-name
        :filters="itemFilters"
        :item="item" />
      <price-trend
        :item="item" />
      <price-prediction v-if="showPredictedPrice" class="mb-4"
        :item="item" />
      <filters-block v-if="!item.stackSize"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item"
        @refine-search="refineSearch" />
      <trade-listing
        ref="tradeService"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item" />
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { PRICE_CHECK_VISIBLE, LOCK_WINDOW } from '../shared/ipc-event'
import { parseClipboard, ItemRarity, ItemCategory } from './parser'
import TradeListing from './TradeListing'
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
    ipcRenderer.on('price-check', (e, clipboard) => {
      const item = parseClipboard(clipboard)
      if (item != null) {
        this.item = item
        this.itemFilters = createFilters(item)
        this.itemStats = initUiModFilters(item)
        ipcRenderer.send(PRICE_CHECK_VISIBLE, true)
      }
    })

    document.addEventListener('mouseenter', (e) => {
      if (e.ctrlKey) {
        this.isClickedAfterLock = false
        ipcRenderer.send(LOCK_WINDOW)
      }
    })
    document.addEventListener('click', () => {
      this.isClickedAfterLock = true
    })
    document.addEventListener('mouseleave', () => {
      if (!this.isClickedAfterLock) {
        ipcRenderer.send(PRICE_CHECK_VISIBLE, false)
      }
    })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        ipcRenderer.send(PRICE_CHECK_VISIBLE, false)
      }
    })
  },
  watch: {
    itemFilters: {
      deep: true,
      immediate: true,
      handler (filters) {
        if (filters == null) return

        // NOTE: children component receives props on nextTick
        this.$nextTick(() => {
          this.$refs.tradeService.execSearch()
        })
      }
    }
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
        this.item.computed.category !== ItemCategory.Map &&
        this.item.computed.category !== ItemCategory.ItemisedMonster
    }
  },
  methods: {
    refineSearch () {
      this.$refs.tradeService.execSearch()
    }
  }
}
</script>
