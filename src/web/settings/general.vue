<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Font size') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex">
        <input v-model.number="config.fontSize" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-fontin-regular text-center" />
        <span class="ml-1">px</span>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Clicking on background focuses game') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.overlayBackgroundClose" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="config.overlayBackgroundClose" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Background, when APT window is clickable') }}</div>
      <div class="mb-1 flex">
        <input v-model="config.overlayBackground" class="rounded bg-gray-900 px-1 block w-48 mb-1 mr-4 font-fontin-regular text-center" />
        <ui-radio v-model="config.overlayBackground" value="rgba(255, 255, 255, 0)">{{ t('Transparent') }}</ui-radio>
      </div>
      <div class="mb-4" v-if="config.overlayBackground !== 'rgba(255, 255, 255, 0)'">
        <ui-radio v-model="config.overlayBackgroundExclusive" :value="true" class="mr-4">{{ t('Show for Overlay and Price Check') }}</ui-radio><br>
        <ui-radio v-model="config.overlayBackgroundExclusive" :value="false">{{ t('Show only for Overlay') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE log file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="config.clientLog"
          class="rounded-l bg-gray-900 px-1 block w-full font-sans" placeholder="???/Grinding Gear Games/Path of Exile/logs/Client.txt">
        <input type="file" id="file-client-log" class="hidden" accept=".txt" @input="handleLogFile">
        <label class="text-gray-400 bg-gray-900 px-2 rounded-r ml-px cursor-pointer" for="file-client-log">{{ t('Browse') }}</label>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('PoE config file') }}</div>
      <div class="mb-4 flex">
        <input v-model.trim="config.gameConfig"
          class="rounded-l bg-gray-900 px-1 block w-full font-sans" placeholder="???/My Games/Path of Exile/production_Config.ini">
        <input type="file" id="file-client-config" class="hidden" accept=".ini" @input="handleGameConfigFile">
        <label class="text-gray-400 bg-gray-900 px-2 rounded-r ml-px cursor-pointer" for="file-client-config">{{ t('Browse') }}</label>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Language') }} <span class="bg-gray-200 text-gray-900 rounded px-1">{{ t('Restart required') }}</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.language" value="en" class="mr-4">English</ui-radio>
        <ui-radio v-model="config.language" value="ru" class="mr-4">Русский</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Auto-download updates') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.disableUpdateDownload" :value="false" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="config.disableUpdateDownload" :value="true" class="mr-4">{{ t('No') }}</ui-radio>
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
      config: computed(() => Config.store),
      handleLogFile (e: InputEvent) {
        Config.store.clientLog = (e.target as HTMLInputElement).files![0].path
      },
      handleGameConfigFile (e: InputEvent) {
        Config.store.gameConfig = (e.target as HTMLInputElement).files![0].path
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Font size": "Размер шрифта",
    "Background, when APT window is clickable": "Фон, когда окно APT кликабельно",
    "Transparent": "Прозрачный",
    "Show for Overlay and Price Check": "Показывать для оверлея и прайс-чека",
    "Show only for Overlay": "Показывать только для оверлея",
    "Clicking on background focuses game": "Нажатие по фону активирует окно игры",
    "Language": "Язык",
    "PoE log file": "Файл логов PoE",
    "PoE config file": "Файл настроек PoE",
    "Browse": "Выбрать",
    "Auto-download updates": "Автозагрузка обновлений"
  }
}
</i18n>
