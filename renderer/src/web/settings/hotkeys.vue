<template>
  <div class="max-w-md p-2">
    <div class="mb-2 bg-gray-700 rounded px-2 py-1 leading-none">
      <i class="fas fa-info-circle"></i> {{ t('settings.clear_hotkey') }}
    </div>
    <div class="mb-8 flex flex-col">
      <label class="mb-1">{{ t('price_check.name') }}</label>
      <div class="flex flex-col gap-y-2 pl-4">
        <div class="flex gap-x-2">
          <label class="flex-1 text-gray-500">{{ t('price_check.hotkey') }}</label>
          <div class="flex w-48 gap-x-1">
            <button :class="{ 'border-transparent': priceCheckHotkeyHold !== 'Ctrl', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Ctrl'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 border leading-none">Ctrl</button>
            <button :class="{ 'border-transparent': priceCheckHotkeyHold !== 'Alt', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Alt'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 border leading-none">Alt</button>
            <span class="flex-1 text-center">+</span>
            <hotkey-input v-model="priceCheckHotkey" class="w-20" no-mod-keys />
          </div>
        </div>
        <div class="flex gap-x-2">
          <label class="flex-1 text-gray-500">{{ t('price_check.hotkey_locked') }}</label>
          <hotkey-input v-model="priceCheckHotkeyLocked" class="w-48" />
        </div>
      </div>
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('settings.overlay') }} <span class="text-red-500 text-lg leading-none">*</span></label>
      <hotkey-input required v-model="overlayKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('map_check.name') }}</label>
      <hotkey-input v-model="itemCheckKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('item.info') }}</label>
      <hotkey-input v-model="itemCheckKey" class="w-48" />
    </div>
    <div class="mb-8 flex">
      <label class="flex-1">{{ t('settings.delve_grid') }}</label>
      <hotkey-input v-model="delveGridKey" class="w-48" />
    </div>
    <div class="mb-8 flex">
      <label class="flex-1">{{ t('settings.stash_scroll') }}</label>
      <div class="flex gap-x-4">
        <ui-radio v-model="stashScroll" :value="true" class="font-poe">Ctrl + MouseWheel</ui-radio>
        <ui-radio v-model="stashScroll" :value="false">{{ t('Disabled') }}</ui-radio>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from './utils'
import { PriceCheckWidget, DelveGridWidget, ItemCheckWidget } from '@/web/overlay/interfaces'
import HotkeyInput from './HotkeyInput.vue'

export default defineComponent({
  name: 'settings.hotkeys',
  components: { HotkeyInput },
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      stashScroll: configModelValue(() => props.config, 'stashScroll'),
      delveGridKey: configModelValue(() => findWidget<DelveGridWidget>('delve-grid', props.config)!, 'toggleKey'),
      itemCheckKey: configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'hotkey'),
      overlayKey: configModelValue(() => props.config, 'overlayKey'),
      priceCheckHotkeyHold: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkeyHold'),
      priceCheckHotkey: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkey'),
      priceCheckHotkeyLocked: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkeyLocked')
    }
  }
})
</script>
