<template>
  <div v-if="price" class="flex items-center pb-4">
    <div class="flex items-center justify-center flex-1">
      <div v-if="isValuableBasetype" class="text-gray-400">Item base</div>
      <div v-else class="w-8 h-8 flex items-center justify-center">
        <img :src="item.computed.icon" :alt="item.name" class="max-w-full max-h-full">
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
</template>

<script>
import { Prices } from '../Prices'
import { isValuableBasetype } from './getDetailsId'

export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    chaosOrb () {
      return Prices.findByDetailsId('chaos-orb')
    },
    exaltedOrb () {
      return Prices.findByDetailsId('exalted-orb')
    },
    price () {
      return this.item.computed.trend
    },
    isValuableBasetype () {
      return isValuableBasetype(this.item)
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
