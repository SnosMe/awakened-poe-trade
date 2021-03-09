<template>
  <widget :config="{ ...config, anchor }" move-handles="none" readonly :removable="false">
    <map-check v-if="isMapLike"
      :item="item" />
    <item-info v-else-if="item"
      :item="item" />
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from '../overlay/Widget.vue'
import MapCheck from '../map-check/MapCheck.vue'
import ItemInfo from './ItemInfo.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { ITEM_CHECK } from '@/ipc/ipc-event'
import { ItemCategory, parseClipboard, ParsedItem } from '@/parser'
import { ItemCheckWidget, WidgetManager } from '../overlay/interfaces'
import * as ipc from '@/ipc/ipc-event'

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
    const { t } = useI18n()

    const checkPosition = ref({ x: 1, y: 1 })
    const item = ref<ParsedItem | null>(null)

    MainProcess.addEventListener(ITEM_CHECK, (e) => {
      const _e = (e as CustomEvent<ipc.IpcItemCheck>).detail
      checkPosition.value = {
        x: _e.position.x - window.screenX,
        y: _e.position.y - window.screenY
      }
      item.value = parseClipboard(_e.clipboard)
      if (item.value) {
        wm.show(props.config.wmId)
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

    const isMapLike = computed(() => {
      if (!item.value) return false
      const { category } = item.value
      return (
        category === ItemCategory.Map ||
        category === ItemCategory.HeistContract ||
        category === ItemCategory.HeistBlueprint ||
        category === ItemCategory.MavenInvitation)
    })

    return {
      t,
      anchor,
      item,
      isMapLike
    }
  }
})
</script>

<i18n>
{
  "ru": {
  }
}
</i18n>
