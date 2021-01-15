<template>
  <div class="flex-grow layout-column bg-gray-800">
    <app-titlebar @close="cancel" :title="t('Settings - Awakened PoE Trade')" native />
    <div class="flex flex-grow min-h-0">
      <div class="px-2 pb-10 bg-gray-900 flex flex-col">
        <router-link :to="{ name: 'settings.hotkeys' }" class="menu-item">{{ t('Hotkeys') }}</router-link>
        <router-link :to="{ name: 'settings.chat' }" class="menu-item">{{ t('Chat') }}</router-link>
        <div class="border-b m-1 border-gray-800"></div>
        <router-link :to="{ name: 'settings.general' }" class="menu-item">{{ t('General') }}</router-link>
        <div class="border-b m-1 border-gray-800"></div>
        <router-link :to="{ name: 'settings.price-check' }" class="menu-item">{{ t('Price check') }}</router-link>
        <router-link :to="{ name: 'settings.maps' }" class="menu-item">{{ t('Maps') }}</router-link>
        <div class="border-b m-1 border-gray-800"></div>
        <router-link :to="{ name: 'settings.debug' }" class="menu-item">{{ t('Debug') }}</router-link>
        <div style="min-width: 9.5rem;"></div>
      </div>
      <div class="text-gray-100 flex-grow layout-column">
        <div class="flex-grow overflow-y-auto">
          <router-view />
        </div>
        <div class="border-t bg-gray-900 border-gray-600 p-2 flex justify-end">
          <button @click="save" class="px-3 bg-gray-800 rounded mr-2">{{ t('Save') }}</button>
          <button @click="cancel" class="px-3">{{ t('Cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Config } from '@/web/Config'
import { MainProcess } from '@/ipc/main-process-bindings'

export default defineComponent({
  setup () {
    const { t } = useI18n()

    document.title = t('Settings - Awakened PoE Trade')

    return {
      t,
      save () {
        MainProcess.closeSettingsWindow(JSON.parse(JSON.stringify(Config.store)))
      },
      cancel () {
        MainProcess.closeSettingsWindow()
      }
    }
  }
})
</script>

<style lang="postcss">
.menu-item {
  text-align: left;
  @apply p-2;
  line-height: 1;
  @apply text-gray-600;
  @apply rounded;
  margin-bottom: 0.125rem;

  &:hover {
    @apply text-gray-100;
  }

  &.active {
    @apply font-fontin-bold;
    @apply text-gray-400;
    @apply bg-gray-800;
  }
}
</style>

<i18n>
{
  "ru": {
    "Settings - Awakened PoE Trade": "Настройки - Awakened PoE Trade",
    "Hotkeys": "Быстрые клавиши",
    "General": "Общие",
    "Price check": "Прайс-чек",
    "Maps": "Карты",
    "Debug": "Debug (Отладка)",
    "Chat": "Чат"
  }
}
</i18n>
