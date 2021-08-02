<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': `min(${wm.width - wm.poeUiWidth}px, 30rem)` }">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ mapName }}</div>
    <fullscreen-image v-if="image" :src="image" />
    <div v-if="!mapStats.length" class="px-8 py-2">
      {{ t('Item has no modifiers.') }}
    </div>
    <div v-else class="py-2 flex flex-col">
      <map-stat-button v-for="stat in mapStats" :key="stat.text"
        :stat="stat" />
      <div v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
        class="py-1 px-8">
        <span class="text-orange-400">{{ t('Not recognized modifier') }} &mdash;</span> {{ stat.text }}
      </div>
    </div>
    <div v-if="hasOutdatedTranslation" class="py-2 px-8 bg-gray-700">{{ t('has_outdated') }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ParsedItem } from '@/parser'
import MapStatButton from './MapStatButton.vue'
import { prepareMapStats } from './prepare-map-stats'
import { TRANSLATED_ITEM_NAME_BY_REF, MAP_IMGS, STAT_BY_MATCH_STR } from '@/assets/data'
import { WidgetManager, ItemCheckWidget } from '../overlay/interfaces'
import { Config } from '@/web/Config'

export default defineComponent({
  components: {
    MapStatButton
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    const config = computed(() => {
      return Config.store.widgets.find(widget => widget.wmType === 'item-check') as ItemCheckWidget
    })

    const mapName = computed(() => {
      const { item } = props
      if (item.rarity === ItemRarity.Unique) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.name || item.baseType)
      } else {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.baseType || item.name)
      }
    })
    const mapStats = computed(() => {
      return prepareMapStats(props.item)
    })
    const image = computed(() => {
      const entry = mapName.value && MAP_IMGS.get(mapName.value)
      return entry && entry.img
    })
    const hasOutdatedTranslation = computed<boolean>(() => {
      return config.value.maps.selectedStats
        .some(entry =>
          entry.decision !== 'seen' &&
          !STAT_BY_MATCH_STR.has(entry.matcher))
    })

    return {
      t,
      wm,
      mapName,
      image,
      mapStats,
      hasOutdatedTranslation
    }
  }
})
</script>

<i18n>
{
  "en": {
    "has_outdated": "Wording of some stats has been changed. Check and update dangerous map mods in the settings. (This message will be hidden as soon as you remove all outdated stats)"
  },
  "ru": {
    "Item has no modifiers.": "На предмете нету модов.",
    "has_outdated": "Перевод некоторых свойств был изменен. Проверьте и обновите опасные моды карт в настройках. (Это сообщение будет скрыто, как только вы удалите все устаревшие переводы)"
  }
}
</i18n>
