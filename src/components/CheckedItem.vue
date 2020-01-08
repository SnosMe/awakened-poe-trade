<template>
  <div class="flex flex-col bg-gray-800 text-gray-200 layout-column">
    <div class="p-4 border-b border-gray-700 layout-column" v-if="price">
      <div class="bg-gray-900 mb-2 p-1 leading-none">{{ item.name }}</div>
      <rare-item v-if="item.rarity === 'Rare' && item.computed.type !== 'Map'" :item="item" class="mb-2" />
      <div v-else class="flex items-center pb-4">
        <div class="flex items-center justify-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center">
            <img :src="price.icon" :alt="price.name" class="max-w-full max-h-full">
          </div>
          <span class="px-1 text-base" v-if="item.stackSize">× 1</span>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base">{{ Number(price.receive.chaosValue.toFixed(1)) }} ×</span>
          <div class="w-8 h-8 flex items-center justify-center">
            <img :src="chaosOrb.icon" :alt="chaosOrb.name" class="max-w-full max-h-full">
          </div>
        </div>
        <div class="px-2 text-center">
          <div class="leading-tight">
            <i v-if="price.receive.totalChange < 0" class="fas fa-angle-double-down pr-1 text-red-600"></i>
            <i v-if="price.receive.totalChange > 0" class="fas fa-angle-double-up pr-1 text-green-500"></i>
            <i v-if="price.receive.totalChange === 0" class="fas fa-equals pr-1 text-gray-600"></i>
            <span>{{ Number(price.receive.totalChange.toFixed(1)) }}&nbsp;%</span>
          </div>
          <div class="text-xs text-gray-500 leading-none">Last 7 days</div>
        </div>
        <div class="w-12 h-8">
          <trend-chart :datasets="[{
            data: price.receive.graphPoints,
            smooth: true,
            fill: true
          }]" padding="2" />
        </div>
      </div>
      <div class="flex overflow-auto">
        <trade-listing :item="item" />
      </div>
    </div>
    <div class="p-4" v-else-if="item">"{{ item.name }}" recognized as a valid PoE item, but not supported currently!</div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { Parser, parseClipboard } from './Parser'
import { Prices } from './Prices'
import RareItem from './RareItem'
import TradeListing from './TradeListing'

export default {
  name: 'CheckedItem',
  components: { RareItem, TradeListing },
  created () {
    ipcRenderer.on('price-check', (e, clipboard) => {
      const item = parseClipboard(clipboard)
      if (item != null) {
        this.item = item
        ipcRenderer.send('price-check-visible', true)
      }
    })
  },
  data () {
    return {
      item: null
    }
  },
  computed: {
    chaosOrb () {
      if (!Prices.isLoaded) return null
      return Prices.findByDetailsId('chaos-orb')
    },
    exaltedOrb () {
      if (!Prices.isLoaded) return null
      return Prices.findByDetailsId('exalted-orb')
    },
    price () {
      if (Prices.isLoaded) {
        if (!this.item) return null

        if (this.item.computed.detailsId === 'chaos-orb') {
          return Prices.findByDetailsId('exalted-orb')
        } else {
          if (this.item.rarity === 'Rare' && this.item.computed.type !== 'Map') {
            return this.item
          } else {
            return Prices.findByDetailsId(this.item.computed.detailsId)
          }
        }
      }
      return null
    }
  }
}
</script>

<style lang="postcss">
/* vue-trend-chart */
.vtc {
  .fill {
    fill: theme('colors.gray.700');
  }

  .stroke {
    stroke: theme('colors.gray.500');
  }
}
</style>
