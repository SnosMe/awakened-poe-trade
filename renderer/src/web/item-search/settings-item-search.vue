<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <HotkeysGeneric :hotkeys="hotkeys" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'item_search.name'
}
</script>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { configProp, _configModelValue, findWidget } from '../settings/utils.js'
import { ItemSearchWidget } from './widget.js'

import HotkeysGeneric, { HotkeySchema } from '../settings/HotkeysGeneric.vue'

const props = defineProps(configProp())

const hotkeys = computed<HotkeySchema[]>(() => {
  const widget = findWidget<ItemSearchWidget>('item-search', props.config)!
  return [{
    translationKey: 'item_search.ocr_gems_key',
    config: _configModelValue(widget, 'ocrGemsKey')
  }]
})
</script>
