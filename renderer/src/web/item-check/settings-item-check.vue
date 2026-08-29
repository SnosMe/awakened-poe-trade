<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <HotkeysGeneric :hotkeys="hotkeys" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'item.info'
}
</script>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { configProp, _configModelValue, findWidget } from '../settings/utils.js'
import type { ItemCheckWidget } from './widget.js'

import HotkeysGeneric, { HotkeySchema } from '../settings/HotkeysGeneric.vue'

const props = defineProps(configProp())

const hotkeys = computed(() => {
  const out: HotkeySchema[] = []

  const isEnglish = props.config.language === 'en'
  const widget = findWidget<ItemCheckWidget>('item-check', props.config)!
  out.push({
    translationKey: 'item.open_on_wiki',
    config: _configModelValue(widget, 'wikiKey')
  })
  out.push({
    translationKey: 'item.open_on_poedb',
    config: _configModelValue(widget, 'poedbKey')
  })
  if (isEnglish) {
    out.push({
      translationKey: 'item.open_on_craftofexile',
      config: _configModelValue(widget, 'craftOfExileKey')
    })
  }
  out.push({
    translationKey: 'item.find_in_stash',
    config: _configModelValue(widget, 'stashSearchKey')
  })
  return out
})
</script>
