<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="p-1 flex">
      <input :placeholder="$t('Search') + '...'" v-model="search" class="bg-gray-900 rounded px-1">
      <ui-toggle v-model="onlySelected" class="ml-2">{{ $t('Only selected') }}</ui-toggle>
      <ui-popper :delayOnMouseOut="150" class="ml-2">
        <template slot="reference">
          <div class="flex items-center justify-center">
            <i class="fas fa-question-circle leading-none mr-1"></i>{{ $t('help') }}</div>
        </template>
        <div class="popper">
          <div class="flex flex-col justify-center text-base text-left"
            v-html="$t('help-text')">
          </div>
        </div>
      </ui-popper>
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
    <recycle-scroller
      class="flex-1" style="overflow-y: scroll;"
      :items="filteredStats"
      key-field="matchRef"
      :item-size="1.875 * fontSize"
      v-slot="{ item }"
    >
      <maps-stat-entry :stat="item" :auto-remove="!onlySelected" />
    </recycle-scroller>
  </div>
</template>

<script>
import { Config } from '@/web/Config'
import { STATS } from '@/assets/data'
import MapsStatEntry from './MapsStatEntry'

export default {
  components: { MapsStatEntry },
  data () {
    return {
      search: '',
      onlySelected: true
    }
  },
  computed: {
    filteredStats () {
      const q = this.search.toLowerCase().split(' ')
      const config = this.config

      return this.statList.filter(stat =>
        q.every(part => stat.searchStr.includes(part)) &&
        (this.onlySelected
          ? (config.selectedStats.some(selected => selected.matchRef === stat.matchRef))
          : true)
      )
    },
    statList () {
      return STATS.flatMap(stat =>
        stat.conditions.map(c => ({
          matchRef: c.ref,
          text: c.string,
          searchStr: c.string.toLowerCase()
        }))
      )
    },
    config () {
      return Config.store.widgets.find(widget => widget.wmType === 'map-check')
    },
    fontSize () {
      return Config.store.fontSize
    }
  }
}
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
