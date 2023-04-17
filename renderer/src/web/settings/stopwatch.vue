<template>
  <div class="max-w-md p-2">
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('stopwatch.toggle_key') }}</label>
      <hotkey-input v-model="toggleKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('stopwatch.reset_key') }}</label>
      <hotkey-input v-model="resetKey" class="w-48" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import HotkeyInput from './HotkeyInput.vue'
import { configProp, configModelValue } from './utils'
import type { StopwatchWidget } from '@/web/overlay/interfaces'

export default defineComponent({
  name: 'stopwatch.name',
  components: { HotkeyInput },
  props: configProp<StopwatchWidget>(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      toggleKey: configModelValue(() => props.configWidget, 'toggleKey'),
      resetKey: configModelValue(() => props.configWidget, 'resetKey')
    }
  }
})
</script>
