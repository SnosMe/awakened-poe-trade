<template>
  <template v-for="itemOrGroup of hotkeys">
    <div v-if="'items' in itemOrGroup" class="flex flex-col gap-1">
      <div>{{ t(itemOrGroup.translationKey) }}</div>
      <div class="flex flex-col gap-2 pl-4 text-gray-500">
        <SettingsHotkey v-for="item in itemOrGroup.items"
          :schema="item" />
      </div>
    </div>
    <SettingsHotkey v-else
      :schema="itemOrGroup" />
  </template>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import SettingsHotkey, { HotkeySchema as SingleHotkey } from '../settings/SettingsHotkey.vue'

export type HotkeySchema = SingleHotkey | HotkeyGroup

interface HotkeyGroup {
  readonly translationKey: string
  readonly items: SingleHotkey[]
}

defineProps<{
  hotkeys: readonly HotkeySchema[]
}>()

const { t } = useI18n()
</script>
