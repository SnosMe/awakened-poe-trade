<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Log level') }}</div>
      <div class="mb-4 flex gap-x-4">
        <ui-radio v-model="logLevel" value="warn">Warn</ui-radio>
        <ui-radio v-model="logLevel" value="silly">Debug</ui-radio>
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
  name: 'settings.debug',
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      logs: Host.logs,
      logLevel: configModelValue(() => props.config, 'logLevel')
    }
  }
})
</script>
