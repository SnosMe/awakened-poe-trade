<template>
  <div v-if="trend" class="flex items-center pb-4" style="min-height: 3rem;">
    <div v-if="!isValuableBasetype && !slowdown.isReady.value" class="flex flex-1 justify-center">
      <div><i class="fas fa-dna fa-spin text-content-muted"></i></div>
      <i18n-t keypath="trade_result.getting_price" class="pl-2">
        <span class="text-content-muted">{{ t(':getting_price_from') }}</span>
      </i18n-t>
    </div>
    <template v-else>
      <item-quick-price class="flex-1 text-base justify-center"
        :price="trend.price"
        :fraction="filters.stackSize != null"
        :item-img="item.info.icon"
        :item-base="item.info"
      >
        <template #item v-if="isValuableBasetype">
          <span class="text-content-muted">{{ t(':base_item') }}</span>
        </template>
      </item-quick-price>
      <div v-if="trend.change" @click="openNinja" :class="$style['trend-btn']">
        <div class="text-center">
          <div class="leading-tight">
            <i v-if="trend.change.forecast === 'down'" class="fas fa-angle-double-down pr-1 text-danger-text"></i>
            <i v-if="trend.change.forecast === 'up'" class="fas fa-angle-double-up pr-1 text-good-text"></i>
            <span v-if="trend.change.forecast === 'const'" class="pr-1 text-content-muted font-sans leading-none">±</span>
            <span>{{ trend.change.text }}</span>
          </div>
          <div class="text-xs text-content-muted leading-none">{{ t(':graph_7d') }}</div>
        </div>
        <div v-if="trend.change" class="w-12 h-8">
          <vue-apexcharts
            type="area"
            :options="{
              chart: { sparkline: { enabled: true }, animations: { enabled: false } },
              stroke: { curve: 'smooth', width: 1, colors: [chartColors.stroke] },
              fill: { colors: [chartColors.fill], type: 'solid' },
              tooltip: { enabled: false },
              plotOptions: { area: { fillTo: 'end' } },
              yaxis: {
                show: false,
                min: trend.change.graph.drawMin,
                max: trend.change.graph.drawMax
              }
            }"
            :series="[{
              data: trend.change.graph.points
            }]"
          />
        </div>
      </div>
    </template>
  </div>
  <div v-else-if="!item.info.craftable" class="flex items-center pb-4" style="min-height: 3rem;">
    <item-quick-price class="flex-1 text-base justify-center"
      currency-text
      :item-img="item.info.icon"
      :item-base="item.info" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from 'vue'
import { useI18nNs } from '@/web/i18n'
import { usePoeninja } from '@/web/background/Prices'
import { isValuableBasetype, getDetailsId } from './getDetailsId'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import VueApexcharts from 'vue3-apexcharts'
import { ParsedItem } from '@/parser'
import { AppConfig } from '@/web/Config'
import { artificialSlowdown } from '../trade/artificial-slowdown'
import { ItemFilters } from '../filters/interfaces'

const slowdown = artificialSlowdown(800)

// ApexCharts takes colors as JS strings, so the theme tokens have to be read off
// the document rather than applied via CSS.
function readToken (name: string): string {
  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue(`--c-${name}`)
    .trim()
  return `rgb(${channels})`
}

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
    const { t } = useI18nNs('trade_result')
    const { findPriceByQuery, autoCurrency } = usePoeninja()

    // `theme` is carried in the result so this recomputes when the theme changes,
    // re-reading the tokens off the document.
    const chartColors = computed(() => ({
      theme: AppConfig().theme,
      stroke: readToken('accent'),
      fill: readToken('accent-dim')
    }))

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const trend = computed(() => {
      const detailsId = getDetailsId(props.item)
      const trend = detailsId && findPriceByQuery(detailsId)
      if (!trend) return

      const price = (props.item.info.refName === 'Divine Orb')
        ? { min: trend.chaos, max: trend.chaos, currency: 'chaos' as const }
        : autoCurrency(trend.chaos)

      return {
        price: price,
        change: deltaFromGraph(trend.graph),
        url: trend.url
      }
    })

    return {
      t,
      trend,
      chartColors,
      openNinja () {
        window.open(trend.value!.url)
      },
      isValuableBasetype: computed(() => {
        return isValuableBasetype(props.item)
      }),
      slowdown
    }
  }
})

function deltaFromGraph (graphPoints: Array<number | null>) {
  const points = graphPoints.filter(p => p != null) as number[]
  if (points.length < 2) return null

  let forecast = 'const'
  if (points.length === 7) {
    if (
      points.filter(p => p > 0).length >= 4 ||
      points.slice(4).every(p => p > 0)
    ) {
      forecast = 'up'
    } else if (
      points.filter(p => p < 0).length >= 4 ||
      points.slice(4).every(p => p < 0)
    ) {
      forecast = 'down'
    }
  }

  const mean = points.reduce((a, b) => a + b) / points.length
  const changeVal = Math.sqrt(points.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (points.length - 1))

  return {
    graph: {
      points,
      drawMin: Math.min(...points) - (changeVal || 1),
      drawMax: Math.max(...points) + (changeVal || 1)
    },
    forecast,
    text: `${Math.round(changeVal * 2)}\u2009%`
  }
}
</script>

<style lang="postcss" module>
.trend-btn {
  display: flex;
  align-items: center;
  @apply gap-x-2;
  cursor: pointer;
  @apply rounded;
  @apply -my-0.5 py-0.5;
  @apply px-1;

  &:hover {
    @apply bg-surface-hover;
  }
}
</style>
