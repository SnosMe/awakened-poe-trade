<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': maxWidth }">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ itemName }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import type { WidgetManager } from '../overlay/interfaces'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    return {
      t,
      maxWidth: computed(() => `min(${wm.size.value.width - wm.poePanelWidth.value}px, 30rem)`),
      itemName: computed(() => props.item.info.name)
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
