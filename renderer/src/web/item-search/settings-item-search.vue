<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <div class="flex">
      <label class="flex-1">{{ t('item_search.ocr_gems_key') }}</label>
      <hotkey-input v-model="ocrGemsKey" class="w-48" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'item_search.name'
}
</script>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from '../settings/utils.js'
import { ItemSearchWidget } from './widget.js'

import HotkeyInput from '../settings/HotkeyInput.vue'

const props = defineProps(configProp())

const ocrGemsKey = configModelValue(() => findWidget<ItemSearchWidget>('item-search', props.config)!, 'ocrGemsKey')
const { t } = useI18n()
</script>
