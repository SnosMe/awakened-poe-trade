<template>
  <div class="max-w-md p-2">
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Start and Pause') }}</label>
      <hotkey-input v-model="toggleKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Reset') }}</label>
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
  name: 'Stopwatch',
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

<i18n>
{
  "ru": {
    "Start and Pause": "Старт и пауза",
    "Reset": "Сброс"
  },
  "zh_CN": {
    "Start and Pause": "开始与暂停",
    "Reset": "重置"
  },
  "cmn-Hant": {
    "Start and Pause": "開始與暫停",
    "Reset": "重置"
  }
}
</i18n>
