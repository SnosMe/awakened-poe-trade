<template>
  <widget :config="{ ...config, anchor }" move-handles="none" readonly :removable="false">
    <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': `min(${wm.width - wm.poeUiWidth}px, 30rem)` }">
      <div class="bg-gray-900 py-1 px-4 text-center">{{ mapName }}</div>
      <fullscreen-image v-if="image" :src="image" />
      <div v-if="!item" class="px-8 py-2">
        {{ t('Item under cursor is not a map.') }}
      </div>
      <div v-else class="py-2 flex flex-col">
        <map-stat-button v-for="stat in mapStats" :key="stat.text"
          :stat="stat" />
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from '../overlay/Widget.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { MAP_CHECK } from '@/ipc/ipc-event'
import { parseClipboard, ItemCategory, ItemRarity, ParsedItem } from '@/parser'
import MapStatButton from './MapStatButton.vue'
import { prepareMapStats } from './prepare-map-stats'
import { TRANSLATED_ITEM_NAME_BY_REF, MAP_IMGS } from '@/assets/data'
import { MapCheckWidget, WidgetManager } from '../overlay/interfaces'
import * as ipc from '@/ipc/ipc-event'

export default defineComponent({
  components: {
    Widget,
    MapStatButton
  },
  props: {
    config: {
      type: Object as PropType<MapCheckWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    const checkPosition = ref({ x: 1, y: 1 })
    const item = ref<ParsedItem | null>(null)

    MainProcess.addEventListener(MAP_CHECK, (e) => {
      const _e = (e as CustomEvent<ipc.IpcMapCheck>).detail
      wm.show(props.config.wmId)
      checkPosition.value = {
        x: _e.position.x - window.screenX,
        y: _e.position.y - window.screenY
      }
      item.value = null
      const item_ = parseClipboard(_e.clipboard)
      if (item_?.category === ItemCategory.Map) {
        item.value = item_
      }
    })

    props.config.wmWants = 'hide'

    const anchor = computed(() => {
      const side = checkPosition.value.x > (wm.width / 2)
        ? 'inventory'
        : 'stash'

      return {
        pos: side === 'stash' ? 'cl' : 'cr',
        y: 50,
        x: side === 'stash'
          ? (wm.poeUiWidth / wm.width) * 100
          : ((wm.width - wm.poeUiWidth) / wm.width) * 100
      }
    })
    const mapName = computed(() => {
      if (!item.value) {
        return t('Invalid item')
      }

      if (item.value.rarity === ItemRarity.Unique) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.value.name || item.value.baseType)
      } else {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.value.baseType || item.value.name)
      }
    })
    const mapStats = computed(() => {
      return prepareMapStats(item.value!)
    })
    const image = computed(() => {
      if (!item.value) return undefined

      const entry = mapName.value && MAP_IMGS.get(mapName.value)
      return entry && entry.img
    })

    return {
      t,
      anchor,
      wm,
      mapName,
      image,
      item,
      mapStats
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Item under cursor is not a map.": "Предмет под курсором не является картой.",
    "Invalid item": "Неверный предмет"
  }
}
</i18n>
