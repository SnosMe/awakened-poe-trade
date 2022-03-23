<template>
  <div
    style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; margin: 0 auto; max-width: 50rem; max-height: 38rem;"
    class="flex-grow layout-column bg-gray-800 rounded-b overflow-hidden animate__animated animate__slideInDown"
  >
    <app-titlebar @close="cancel" :title="t('Settings - Awakened PoE Trade')" />
    <div class="flex flex-grow min-h-0">
      <div class="pl-2 pt-2 bg-gray-900 flex flex-col gap-1" style="min-width: 10rem;">
        <template v-for="(item, itemIdx) of menuItems" :key="itemIdx">
          <button v-if="!item.isSeparator"
            @click="item.select" :class="[$style['menu-item'], { [$style['active']]: item.isSelected }]">{{ item.name }}</button>
          <div v-else
            class="border-b mx-2 border-gray-800" />
        </template>
        <div class="text-gray-400 text-center mt-auto pr-3 pt-4 pb-12" style="max-width: fit-content;">{{ t('Support development on') }}<br> <a href="https://patreon.com/awakened_poe_trade" class="inline-flex mt-1" target="_blank"><img class="inline h-5" src="/images/Patreon.svg"></a></div>
      </div>
      <div class="text-gray-100 flex-grow layout-column bg-gray-900">
        <div class="flex-grow overflow-y-auto bg-gray-800 rounded-tl">
          <component v-if="configClone"
            :is="selectedComponent" :config="configClone" />
        </div>
        <div class="border-t bg-gray-900 border-gray-600 p-2 flex justify-end gap-x-2">
          <button @click="save" class="px-3 bg-gray-800 rounded">{{ t('Save') }}</button>
          <button @click="cancel" class="px-3">{{ t('Cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, Component, PropType, nextTick, inject, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppConfig, updateConfig, saveConfig } from '@/web/Config'
import type { Config } from '@/../../ipc/types'
import type { Widget, WidgetManager } from '@/web/overlay/interfaces'
import SettingsHotkeys from './hotkeys.vue'
import SettingsChat from './chat.vue'
import SettingsGeneral from './general.vue'
import SettingsPricecheck from './price-check.vue'
import SettingsDebug from './debug.vue'
import SettingsMaps from './maps/maps.vue'

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<Widget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    nextTick(() => {
      props.config.wmWants = 'hide'
    })

    const selectedComponent = shallowRef<Component>(SettingsHotkeys)

    const configClone = shallowRef<Config | null>(null)
    watch(() => props.config.wmWants, (wmWants) => {
      if (wmWants === 'show') {
        configClone.value = reactive(JSON.parse(JSON.stringify(AppConfig())))
      } else {
        configClone.value = null
      }
    })

    watch(() => props.config.wmFlags, (wmFlags) => {
      if (wmFlags.includes('settings:price-check')) {
        selectedComponent.value = SettingsPricecheck
        wm.setFlag(props.config.wmId, 'settings:price-check', false)
      }
    }, { deep: true })

    const menuItems = computed(() => [
      {
        name: t('Hotkeys'),
        select () { selectedComponent.value = SettingsHotkeys },
        isSelected: (selectedComponent.value === SettingsHotkeys)
      },
      {
        name: t('Chat'),
        select () { selectedComponent.value = SettingsChat },
        isSelected: (selectedComponent.value === SettingsChat)
      },
      { isSeparator: true },
      {
        name: t('General'),
        select () { selectedComponent.value = SettingsGeneral },
        isSelected: (selectedComponent.value === SettingsGeneral)
      },
      { isSeparator: true },
      {
        name: t('Price check'),
        select () { selectedComponent.value = SettingsPricecheck },
        isSelected: (selectedComponent.value === SettingsPricecheck)
      },
      {
        name: t('Maps'),
        select () { selectedComponent.value = SettingsMaps },
        isSelected: (selectedComponent.value === SettingsMaps)
      },
      { isSeparator: true },
      {
        name: t('Debug'),
        select () { selectedComponent.value = SettingsDebug },
        isSelected: (selectedComponent.value === SettingsDebug)
      }
    ])

    return {
      t,
      save () {
        updateConfig(configClone.value!)
        saveConfig()
        wm.hide(props.config.wmId)
      },
      cancel () {
        wm.hide(props.config.wmId)
      },
      menuItems,
      selectedComponent,
      configClone
    }
  }
})
</script>

<style lang="postcss" module>
.menu-item {
  text-align: left;
  @apply p-2;
  line-height: 1;
  @apply text-gray-600;
  @apply rounded-l;

  &:hover {
    @apply text-gray-100;
  }

  &.active {
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
