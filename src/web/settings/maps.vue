<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="p-1 flex">
      <input :placeholder="t('Search') + '...'" v-model="search" class="bg-gray-900 rounded px-1">
      <ui-toggle v-model="onlySelected" class="mx-2">{{ t('Only selected') }}</ui-toggle>
      <ui-toggle v-model="showNewStats" class="ml-12">{{ t('Show new stats') }}</ui-toggle>
    </div>
    <div class="flex font-bold py-1 shadow">
      <div class="flex-1 px-2">{{ t('Stat (found: {0})', [filteredStats.length]) }}</div>
      <div class="flex" style="padding-right: calc(0.875rem + 1.5rem);">
        <div class="w-8 mx-1 leading-none flex items-center justify-center bg-orange-600">
          <i class="fas fa-exclamation-triangle"></i></div>
        <div class="w-8 mx-0 leading-none flex items-center justify-center bg-red-700">
          <i class="fas fa-skull-crossbones"></i></div>
        <div class="w-8 mx-1 leading-none flex items-center justify-center bg-green-700">
          <i class="fas fa-check"></i></div>
      </div>
    </div>
    <virtual-scroll
      class="flex-1"
      style="overflow-y: scroll;"
      :items="filteredStats"
      :item-height="1.875 * fontSize"
      v-slot="props"
    >
      <maps-stat-entry
        :style="{ position: 'absolute', top: `${props.top}px` }"
        :class="{ 'text-red-400': props.item.outdated }"
        :matcher="props.item.matchStr"
        :selected-stats="selectedStats" />
    </virtual-scroll>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, findWidget } from './utils'
import type { ItemCheckWidget } from '@/web/overlay/interfaces'
import { STAT_BY_REF, STAT_BY_MATCH_STR } from '@/assets/data'
import MapsStatEntry from './MapsStatEntry.vue'
import VirtualScroll from '../ui/VirtualScroll.vue'

export default defineComponent({
  components: { MapsStatEntry, VirtualScroll },
  props: configProp(),
  setup (props) {
    const search = ref('')
    const onlySelected = ref(true)

    const widget = computed(() => findWidget<ItemCheckWidget>('item-check', props.config)!)

    const statList = computed(() => {
      const out: Array<{ matchStr: string, searchStr: string }> = []
      for (const statRef of STAT_BY_REF.keys()) {
        const { stat } = STAT_BY_REF.get(statRef)!
        for (const c of stat.matchers) {
          out.push({
            matchStr: c.string,
            searchStr: c.string.toLowerCase()
          })
        }
      }
      return out
    })

    const selectedMatchers = computed(() => {
      return new Set(
        widget.value.maps.selectedStats
          .filter(entry => entry.decision !== 'seen')
          .map(entry => entry.matcher))
    })

    const showNewStats = computed<boolean>({
      get () { return widget.value.maps.showNewStats },
      set (value) { widget.value.maps.showNewStats = value }
    })

    const hasOutdatedTranslation = computed<string[]>(() => {
      return widget.value.maps
        .selectedStats
        .filter(entry =>
          entry.decision !== 'seen' &&
          !STAT_BY_MATCH_STR.has(entry.matcher))
        .map(entry => entry.matcher)
    })

    const { t } = useI18n()

    return {
      t,
      search,
      onlySelected,
      showNewStats,
      filteredStats: computed(() => {
        const q = search.value.toLowerCase().split(' ')

        const filtered = statList.value
          .filter(stat =>
            q.every(part => stat.searchStr.includes(part)) &&
            (onlySelected.value
              ? selectedMatchers.value.has(stat.matchStr)
              : true)
          )
          .map(({ matchStr }) => ({ matchStr, outdated: false }))

        return [
          ...hasOutdatedTranslation.value
            .map((matchStr) => ({ matchStr, outdated: true })),
          ...filtered
        ]
      }),
      selectedStats: computed(() => widget.value.maps.selectedStats),
      fontSize: computed(() => props.config.fontSize)
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Only selected": "Только выбранные",
    "Stat (found: {0})": "Свойства (найдено: {0})",
    "Show new stats": "Показывать новые статы"
  }
}
</i18n>
