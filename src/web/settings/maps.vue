<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="p-1 flex">
      <input :placeholder="$t('Search') + '...'" v-model="search" class="bg-gray-900 rounded px-1">
      <ui-toggle v-model="onlySelected" class="mx-2">{{ $t('Only selected') }}</ui-toggle>
      <ui-popover>
        <template #target>
          <div class="flex items-center justify-center">
            <i class="fas fa-question-circle leading-none mr-1"></i>{{ $t('help') }}</div>
        </template>
        <template #content>
          <div class="flex flex-col justify-center text-base"
            v-html="$t('help-text')">
          </div>
        </template>
      </ui-popover>
    </div>
    <div class="flex font-bold py-1 shadow">
      <div class="flex-1 px-2">{{ $t('Stat (found: {0})', [filteredStats.length]) }}</div>
      <div class="flex" style="padding-right: calc(0.875rem + 1.5rem);">
        <div class="px-2">{{ $t('Invert') }}</div>
        <div class="w-12 bg-orange-600 rounded-l leading-none flex items-center justify-center">
          <i class="fas fa-exclamation-triangle"></i></div>
        <div class="w-12 bg-red-700 mx-px leading-none flex items-center justify-center">
          <i class="fas fa-skull-crossbones"></i></div>
        <div class="w-12 bg-green-700 rounded-r leading-none flex items-center justify-center">
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
        :matcher="props.item.matchStr"
        :auto-remove="!onlySelected" />
    </virtual-scroll>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { Config } from '@/web/Config'
import { STATS } from '@/assets/data'
import MapsStatEntry from './MapsStatEntry.vue'
import { MapCheckWidget } from '../overlay/interfaces'
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
      return Config.store.widgets.find(widget => widget.wmType === 'map-check') as MapCheckWidget
    })

    return {
      search,
      onlySelected,
      filteredStats: computed(() => {
        const q = search.value.toLowerCase().split(' ')

        return statList.value.filter(stat =>
          q.every(part => stat.searchStr.includes(part)) &&
          (onlySelected.value
            ? (config.value.selectedStats.some(selected => selected.matcher === stat.matchStr))
            : true)
        )
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
  "en": {
    "help-text": "- Use \"Invert\" toggle on stats like \"-7% maximum Player Resistances\".<br>- Non-numeric values are valid (for example, \"+\"), it just means<br>highlight stat without taking into account rolled value."
  },
  "ru": {
    "Only selected": "Только выбранные",
    "help": "справка",
    "Stat (found: {0})": "Свойства (найдено: {0})",
    "Invert": "Инвертировать",
    "help-text": "- Используйте переключатель \"Инвертировать\" на таких свойствах как \"-7% максимум сопротивлений игроков\".<br>- Нечисловые значения действительны (например, \"+\"), это просто означает<br>подсветить свойство не обращая внимание на ролл."
  }
}
</i18n>
