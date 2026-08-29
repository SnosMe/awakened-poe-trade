<template>
  <div class="flex flex-col gap-4 p-2 max-w-md">
    <HotkeysGeneric :hotkeys="hotkeys" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'stopwatch.name'
}
</script>

<script setup lang="ts">
import { defineProps, computed } from 'vue'
import { configProp, _configModelValue } from '../settings/utils.js'
import type { StopwatchWidget } from '@/web/overlay/interfaces'

import HotkeysGeneric, { HotkeySchema } from '../settings/HotkeysGeneric.vue'

const props = defineProps(configProp<StopwatchWidget>())

const hotkeys = computed<HotkeySchema[]>(() => [{
  translationKey: 'stopwatch.toggle_key',
  config: _configModelValue(props.configWidget, 'toggleKey')
}, {
  translationKey: 'stopwatch.reset_key',
  config: _configModelValue(props.configWidget, 'resetKey')
}])
</script>
