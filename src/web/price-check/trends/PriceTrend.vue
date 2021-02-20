<template>
  <div v-if="trend" class="flex items-center pb-4" style="min-height: 3rem;">
    <div v-if="!isValuableBasetype && !slowdown.isReady.value" class="flex flex-1 justify-center">
      <div><i class="fas fa-dna fa-spin text-gray-600"></i></div>
      <div class="pl-2">{{ t('Getting price') }} <span class="text-gray-600">{{ t('from poe.ninja ...') }}</span></div>
    </div>
    <template v-else>
      <item-quick-price class="flex-1"
        :min="trend.price.val"
        :max="trend.price.val"
        :fraction="filters.stackSize != null"
        :item-img="trend.icon"
        :currency="trend.price.curr === 'e' ? 'exa' : 'chaos'"
      >
        <template #item v-if="isValuableBasetype">
          <button class="text-gray-400 hover:bg-gray-700 rounded px-1 -mx-1"
            @click="$emit('filter-item-base')">{{ t('Base item') }}</button>
        </template>
      </item-quick-price>
      <div v-if="trend.changeStr" class="px-2 text-center">
        <div class="leading-tight">
          <i v-if="trend.changeStr === 'down'" class="fas fa-angle-double-down pr-1 text-red-600"></i>
          <i v-if="trend.changeStr === 'up'" class="fas fa-angle-double-up pr-1 text-green-500"></i>
          <span v-if="trend.changeStr === 'const'" class="pr-1 text-gray-600 font-sans leading-none">±</span>
          <span>{{ Math.round(trend.changeVal * 2) }}{{ '\u2009' }}%</span>
        </div>
        <div class="text-xs text-gray-500 leading-none">{{ t('Last 7 days') }}</div>
      </div>
      <div v-if="trend.changeStr" class="w-12 h-8">
        <vue-apexcharts
          type="area"
          :options="{
            chart: { sparkline: { enabled: true }, animations: { enabled: false } },
            stroke: { curve: 'smooth', width: 1, colors: ['#a0aec0' /* gray.500 */] },
            fill: { colors: ['#4a5568' /* gray.700 */], type: 'solid' },
            tooltip: { enabled: false },
            plotOptions: { area: { fillTo: 'end' } },
            yaxis: {
              show: false,
              min: Math.min(...trend.receive.graphPoints) - (trend.changeVal || 1),
              max: Math.max(...trend.receive.graphPoints) + (trend.changeVal || 1)
            }
          }"
          :series="[{
            data: trend.receive.graphPoints
          }]"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { findByDetailsId, autoCurrency } from '../../background/Prices'
import { isValuableBasetype, getDetailsId } from './getDetailsId'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import VueApexcharts from 'vue3-apexcharts'
import { ParsedItem } from '@/parser'
import { artificialSlowdown } from '../trade/artificial-slowdown'
import { ItemFilters } from '../filters/interfaces'

export default defineComponent({
  components: {
    ItemQuickPrice,
    VueApexcharts
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    },
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    }
  },
  setup (props) {
    const slowdown = artificialSlowdown(800)
    watch(() => props.item, (item) => {
      slowdown.reset(item)
    })

    const trend = computed(() => {
      const detailsId = getDetailsId(props.item)
      const trend = detailsId && findByDetailsId(detailsId)
      if (!trend) return

      const price = (props.item.name === 'Exalted Orb')
        ? { val: trend.receive.chaosValue, curr: 'c' }
        : autoCurrency(trend.receive.chaosValue, 'c')

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
    })

    const { t } = useI18n()

    return {
      t,
      trend,
      isValuableBasetype: computed(() => {
        return isValuableBasetype(props.item)
      }),
      slowdown
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Base item": "База предмета",
    "Last 7 days": "За неделю",
    "Getting price": "Получение цены",
    "from poe.ninja ...": "с poe.ninja ..."
  }
}
</i18n>
