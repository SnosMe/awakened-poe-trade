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
        :matcher="props.item.matchStr" />
    </virtual-scroll>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Config } from '@/web/Config'
import { STATS, STAT_BY_MATCH_STR } from '@/assets/data'
import MapsStatEntry from './MapsStatEntry.vue'
import { ItemCheckWidget } from '../overlay/interfaces'
import VirtualScroll from '../ui/VirtualScroll.vue'

const statList = computed(() => {
  return STATS.flatMap(({ stat }) =>
    stat.matchers.map(c => ({
      matchStr: c.string,
      searchStr: c.string.toLowerCase()
    }))
  )
})

export default defineComponent({
  components: { MapsStatEntry, VirtualScroll },
  setup () {
    const search = ref('')
    const onlySelected = ref(true)

    const config = computed(() => {
      return Config.store.widgets.find(widget => widget.wmType === 'item-check') as ItemCheckWidget
    })

    const selectedMatchers = computed(() => {
      return new Set(
        config.value.maps.selectedStats
          .filter(entry => entry.decision !== 'seen')
          .map(entry => entry.matcher))
    })

    const showNewStats = computed<boolean>({
      get () { return config.value.maps.showNewStats },
      set (value) { config.value.maps.showNewStats = value }
    })

    const hasOutdatedTranslation = computed<string[]>(() => {
      return config.value.maps.selectedStats
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
      fontSize: computed(() => {
        return Config.store.fontSize
      })
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
