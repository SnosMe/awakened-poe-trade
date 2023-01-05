<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Log level') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex gap-x-4">
        <ui-radio v-model="logLevel" value="warn">Warn</ui-radio>
        <ui-radio v-model="logLevel" value="silly">Debug</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE window title') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4">
        <input v-model="windowTitle" class="rounded bg-gray-900 px-1 block w-full mb-1 font-poe" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Log') }}</div>
      <pre class="mb-4 bg-gray-900 rounded p-2">{{ logs }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue } from './utils'
import { Host } from '@/web/background/IPC'

export default defineComponent({
  name: 'Debug',
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      logs: Host.logs,
      logLevel: configModelValue(() => props.config, 'logLevel'),
      windowTitle: configModelValue(() => props.config, 'windowTitle')
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Log level": "Уровень логов",
    "Hardware Acceleration": "Аппаратное ускорение",
    "Disabled (render on CPU)": "Отключено (рендерить на CPU)",
    "PoE window title": "Заголовок окна игры"
  },
  "zh_CN": {
    "Log level": "日志级别",
    "Hardware Acceleration": "硬件加速",
    "Disabled (render on CPU)": "禁用 ( 由CPU渲染 )",
    "PoE window title": "PoE窗口标题"
  },
  "zh_A_V1": {
    "Log level": "日志级别",
    "Hardware Acceleration": "硬件加速",
    "Disabled (render on CPU)": "禁用 ( 由CPU渲染 )",
    "PoE window title": "PoE窗口标题"
  },
  "zh_A_V2": {
    "Log level": "日志级别",
    "Hardware Acceleration": "硬件加速",
    "Disabled (render on CPU)": "禁用 ( 由CPU渲染 )",
    "PoE window title": "PoE窗口标题"
  },
  "cmn-Hant": {
    "Log level": "日誌級別",
    "Hardware Acceleration": "硬件加速",
    "Disabled (render on CPU)": "禁用 ( CPU渲染 )",
    "PoE window title": "PoE窗口標題"
  }
}
</i18n>
