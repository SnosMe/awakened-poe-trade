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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ParsedItem } from '@/parser'
import MapStatButton from './MapStatButton.vue'
import { prepareMapStats } from './prepare-map-stats'
import { TRANSLATED_ITEM_NAME_BY_REF, MAP_IMGS } from '@/assets/data'
import { WidgetManager } from '../overlay/interfaces'

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

    return {
      t,
      wm,
      mapName,
      image,
      mapStats
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Item has no modifiers.": "На предмете нету модов."
  }
}
</i18n>
