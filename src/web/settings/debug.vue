<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Log level') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.logLevel" value="warn" class="mr-4">Warn</ui-radio>
        <ui-radio v-model="config.logLevel" value="debug" class="mr-4">Debug</ui-radio>
        <ui-radio v-model="config.logLevel" value="silly">Silly</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Hardware Acceleration') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.hardwareAcceleration" :value="true" class="mr-4">{{ t('Enabled') }}</ui-radio>
        <ui-radio v-model="config.hardwareAcceleration" :value="false" class="mr-4">{{ t('Disabled (render on CPU)') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Shortcut registration') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.useOsGlobalShortcut" :value="true" class="mr-4">{{ t('OS global (blocking)') }}</ui-radio>
        <ui-radio v-model="config.useOsGlobalShortcut" :value="false" class="mr-4">{{ t('Hook (non-blocking)') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE window title') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4">
        <input v-model="config.windowTitle" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Restore clipboard') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.restoreClipboard" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="config.restoreClipboard" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Config } from '@/web/Config'

export default defineComponent({
  setup () {
    const { t } = useI18n()

    return {
      t,
      config: computed(() => Config.store)
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
    "Shortcut registration": "Регистрация быстрых клавиш",
    "OS global (blocking)": "На уровне ОС (блокирует)",
    "Hook (non-blocking)": "Хук (не блокирует нажатия)",
    "PoE window title": "Заголовок окна игры",
    "Restore clipboard": "Восстанавливать буфер обмена"
  }
}
</i18n>
