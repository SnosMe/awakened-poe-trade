<template>
  <div v-if="price" class="flex items-center pb-4">
    <div class="flex items-center justify-center flex-1">
      <div v-if="isValuableBasetype" class="text-gray-400">Item base</div>
      <div v-else class="w-8 h-8 flex items-center justify-center">
        <img :src="item.computed.icon" :alt="item.name" class="max-w-full max-h-full">
      </div>
      <span class="px-1 text-base" v-if="item.stackSize">× 1</span>
      <i class="fas fa-arrow-right text-gray-600 px-2"></i>
      <span class="px-1 text-base">{{ price.value.val | displayRounding(true) }} ×</span>
      <div class="w-8 h-8 flex items-center justify-center">
        <img :src="icon[price.value.curr].url" :alt="icon[price.value.curr].text" class="max-w-full max-h-full">
      </div>
    </div>
    <div class="px-2 text-center">
      <div class="leading-tight">
        <i v-if="price.receive.totalChange < 0" class="fas fa-angle-double-down pr-1 text-red-600"></i>
        <i v-if="price.receive.totalChange > 0" class="fas fa-angle-double-up pr-1 text-green-500"></i>
        <i v-if="price.receive.totalChange === 0" class="fas fa-equals pr-1 text-gray-600"></i>
        <span>{{ price.receive.totalChange | displayRounding }}&nbsp;%</span>
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
import { Prices, displayRounding } from '../Prices'
import { isValuableBasetype } from './getDetailsId'

export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  filters: { displayRounding },
  computed: {
    icon () {
      return {
        e: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?scale=1&w=1&h=1',
          text: 'exa'
        },
        c: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?scale=1&w=1&h=1',
          text: 'chaos'
        }
      }
    },
    price () {
      const price = this.item.computed.trend
      if (!price) return

      const value = (this.item.name === 'Exalted Orb')
        ? { val: price.receive.chaosValue, curr: 'c' }
        : Prices.autoCurrency(price.receive.chaosValue, 'c')

      return { value, ...price }
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
