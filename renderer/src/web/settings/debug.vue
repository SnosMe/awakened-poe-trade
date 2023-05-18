<template>
  <div class="layout-column">
    <div class="p-2 shadow">
      <ui-checkbox v-model="logKeys">{{ t('settings.debug_hotkeys') }}</ui-checkbox>
    </div>
    <pre class="p-2 overflow-y-scroll flex-1">{{ logs }}</pre>
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
      logKeys: configModelValue(() => props.config, 'logKeys')
    }
  }
})
</script>
