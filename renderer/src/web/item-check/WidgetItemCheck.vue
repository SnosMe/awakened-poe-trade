<template>
  <widget :config="{ ...config, anchor }" move-handles="none" :removable="false" :inline-edit="false">
    <template v-if="item">
      <map-check v-if="isMapLike"
        :item="item" />
      <item-info v-else
        :item="item" />
    </template>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from 'vue'
import Widget from '../overlay/Widget.vue'
import MapCheck from '../map-check/MapCheck.vue'
import ItemInfo from './ItemInfo.vue'
import { MainProcess } from '@/web/background/IPC'
import { ItemCategory, parseClipboard, ParsedItem } from '@/parser'
import { registerActions } from './hotkeyable-actions'
import type { ItemCheckWidget, WidgetManager } from '../overlay/interfaces'

export default defineComponent({
  components: {
    Widget,
    MapCheck,
    ItemInfo
  },
  props: {
    config: {
      type: Object as PropType<ItemCheckWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    const checkPosition = ref({ x: 1, y: 1 })
    const item = ref<ParsedItem | null>(null)

    registerActions()

    MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
      if (e.target !== 'item-check') return

      checkPosition.value = e.position
      item.value = parseClipboard(e.clipboard)
      if (item.value) {
        wm.show(props.config.wmId)
      }
    })

    props.config.wmWants = 'hide'

    const anchor = computed(() => {
      const width = wm.size.value.width
      const poePanelWidth = wm.poePanelWidth.value

      const side = checkPosition.value.x > (window.screenX + width / 2)
        ? 'inventory'
        : 'stash'

      return {
        pos: side === 'stash' ? 'cl' : 'cr',
        y: 50,
        x: side === 'stash'
          ? (poePanelWidth / width) * 100
          : ((width - poePanelWidth) / width) * 100
      }
    })

    const isMapLike = computed(() => {
      if (!item.value) return false
      const { category, info: { refName } } = item.value
      return (
        category === ItemCategory.Map ||
        category === ItemCategory.HeistContract ||
        category === ItemCategory.HeistBlueprint ||
        category === ItemCategory.Invitation ||
        refName === 'Expedition Logbook')
    })

    return {
      anchor,
      item,
      isMapLike
    }
  }
})
</script>
