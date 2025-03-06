<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <div class="flex">
      <label class="flex-1">{{ t('item.open_on_wiki') }}</label>
      <hotkey-input v-model="wikiKey" class="w-48" />
    </div>
    <div class="flex">
      <label class="flex-1">{{ t('item.open_on_poedb') }}</label>
      <hotkey-input v-model="poedbKey" class="w-48" />
    </div>
    <div v-if="isEnglish" class="flex">
      <label class="flex-1">Open base item on Craft of Exile</label>
      <hotkey-input v-model="craftOfExileKey" class="w-48" />
    </div>
    <div class="flex">
      <label class="flex-1">{{ t('item.find_in_stash') }}</label>
      <hotkey-input v-model="stashSearchKey" class="w-48" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'item.info'
}
</script>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from '../settings/utils.js'
import type { ItemCheckWidget } from './widget.js'

import HotkeyInput from '../settings/HotkeyInput.vue'

const props = defineProps(configProp())

const isEnglish = computed(() => props.config.language === 'en')
const wikiKey = configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'wikiKey')
const poedbKey = configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'poedbKey')
const craftOfExileKey = configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'craftOfExileKey')
const stashSearchKey = configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'stashSearchKey')
const { t } = useI18n()
</script>
