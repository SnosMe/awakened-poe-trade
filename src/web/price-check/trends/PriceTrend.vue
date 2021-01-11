<template>
  <div v-if="trend" class="flex items-center pb-4">
    <item-quick-price class="flex-1"
      :min="trend.price.val"
      :max="trend.price.val"
      fraction
      :item-img="trend.icon"
      :currency="trend.price.curr === 'e' ? 'exa' : 'chaos'"
    >
      <template #item v-if="isValuableBasetype">
        <button class="text-gray-400 hover:bg-gray-700 rounded px-1 -mx-1"
          @click="$emit('filter-item-base')">{{ $t('Base item') }}</button>
      </template>
    </item-quick-price>
    <div v-if="trend.changeStr" class="px-2 text-center">
      <div class="leading-tight">
        <i v-if="trend.changeStr === 'down'" class="fas fa-angle-double-down pr-1 text-red-600"></i>
        <i v-if="trend.changeStr === 'up'" class="fas fa-angle-double-up pr-1 text-green-500"></i>
        <span v-if="trend.changeStr === 'const'" class="pr-1 text-gray-600 font-sans leading-none">±</span>
        <span>{{ Math.round(trend.changeVal * 2) }}{{ '\u2009' }}%</span>
      </div>
      <div class="text-xs text-gray-500 leading-none">{{ $t('Last 7 days') }}</div>
    </div>
    <div v-if="trend.changeStr" class="w-12 h-8">
      <!-- <trend-chart padding="2"
      :datasets="[{
        data: trend.receive.graphPoints,
        smooth: true,
        fill: true
      }]"
      :min="Math.min(...trend.receive.graphPoints) - trend.changeVal"
      :max="Math.max(...trend.receive.graphPoints) + trend.changeVal" /> -->
    </div>
  </div>
</template>

<script>
import { Prices } from '../Prices'
import { isValuableBasetype, getDetailsId } from './getDetailsId'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice'

export default {
  components: { ItemQuickPrice },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    trend () {
      const detailsId = getDetailsId(this.item)
      const trend = Prices.findByDetailsId(detailsId)
      if (!trend) return

      const price = (this.item.name === 'Exalted Orb')
        ? { val: trend.receive.chaosValue, curr: 'c' }
        : Prices.autoCurrency(trend.receive.chaosValue, 'c')

      if (trend.receive.graphPoints.length >= 2) {
        let changeStr = 'const'
        if (trend.receive.graphPoints.length === 7) {
          if (
            trend.receive.graphPoints.filter(p => p > 0).length >= 4 ||
            trend.receive.graphPoints.slice(4).every(p => p > 0)
          ) {
            changeStr = 'up'
          } else if (
            trend.receive.graphPoints.filter(p => p < 0).length >= 4 ||
            trend.receive.graphPoints.slice(4).every(p => p < 0)
          ) {
            changeStr = 'down'
          }
        }

        const n = trend.receive.graphPoints.length
        const mean = trend.receive.graphPoints.reduce((a, b) => a + b) / n
        const changeVal = Math.sqrt(trend.receive.graphPoints.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1))

        return { price, ...trend, changeStr, changeVal }
      } else {
        return { price, ...trend }
      }
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

<i18n>
{
  "ru": {
    "Base item": "База предмета",
    "Last 7 days": "За неделю"
  }
}
</i18n>
