<template>
  <div class="flex flex-col bg-gray-800 text-gray-200 layout-column" v-if="item">
    <div class="p-4 border-b border-gray-700 layout-column">
      <div class="bg-gray-900 mb-2 p-1 leading-none">{{ item.name }}</div>
      <price-trend :item="item" />
      <rare-item v-if="showPredictedPrice" :item="item" class="mb-2" />
      <trade-listing v-else :item="item" />
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { PRICE_CHECK_VISIBLE, LOCK_WINDOW } from '../shared/ipc-event'
import { parseClipboard } from './Parser'
import RareItem from './RareItem'
import TradeListing from './TradeListing'
import PriceTrend from './trends/PriceTrend'

export default {
  name: 'CheckedItem',
  components: { RareItem, TradeListing, PriceTrend },
  created () {
    ipcRenderer.on('price-check', (e, clipboard) => {
      const item = parseClipboard(clipboard)
      if (item != null) {
        this.item = item
        ipcRenderer.send(PRICE_CHECK_VISIBLE, true)
      }
    })

    document.addEventListener('mouseenter', (e) => {
      if (e.ctrlKey) {
        ipcRenderer.send(LOCK_WINDOW, false)
      }
    })

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        ipcRenderer.send(PRICE_CHECK_VISIBLE, false)
      }
    })
  },
  data () {
    return {
      item: null
    }
  },
  computed: {
    showPredictedPrice () {
      return this.item.rarity === 'Rare' &&
        this.item.computed.category !== 'Map' &&
        this.item.computed.category !== 'Itemised Monster'
    }
  }
}
</script>
