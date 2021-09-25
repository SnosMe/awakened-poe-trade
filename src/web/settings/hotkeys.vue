<template>
  <div class="max-w-md p-2">
    <div class="bg-gray-700 rounded px-2 py-1 mb-2 leading-none">
      <i class="fas fa-info-circle"></i> {{ t('You can clear hotkey by pressing Backspace') }}</div>
    <div class="mb-8">
      <div class="flex">
        <div class="flex-1">{{ t('Price check') }}</div>
        <div class="flex">
          <span class="text-gray-500 mr-2">{{ t('Auto-hide Mode') }}</span>
          <button :class="{ border: priceCheckHotkeyHold === 'Ctrl', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Ctrl'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 leading-none mr-1">Ctrl</button>
          <button :class="{ border: priceCheckHotkeyHold === 'Alt', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Alt'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 leading-none">Alt</button>
          <span class="mx-4">+</span>
          <hotkey-input v-model="priceCheckHotkey" class="w-20" no-mod-keys />
        </div>
      </div>
      <div class="text-right mt-2">
        <span class="text-gray-500 mr-2">{{ t('Open without auto-hide') }}</span>
        <hotkey-input v-model="priceCheckHotkeyLocked" class="w-48" />
      </div>
    </div>
    <div class="mb-4">
      <div class="flex">
        <div class="flex-1">{{ t('Overlay') }} <span class="text-red-500 text-lg leading-none">*</span></div>
        <hotkey-input required v-model="overlayKey" class="w-48" />
      </div>
    </div>
    <div class="mb-4">
      <div class="flex">
        <div class="flex-1">{{ t('Open item on wiki') }}</div>
        <hotkey-input v-model="wikiKey" class="w-48" />
      </div>
    </div>
    <div class="mb-4">
      <div class="flex">
        <div class="flex-1">{{ t('Map check') }}</div>
        <!-- <div class="flex-1">{{ t('Item info') }}</div> -->
        <hotkey-input v-model="itemCheckKey" class="w-48" />
      </div>
    </div>
    <div v-if="isEnglish" class="mb-4">
      <div class="flex">
        <div class="flex-1">Open base item on Craft of Exile</div>
        <hotkey-input v-model="craftOfExileKey" class="w-48" />
      </div>
    </div>
    <div class="mb-8">
      <div class="flex">
        <div class="flex-1">{{ t('Delve grid') }}</div>
        <hotkey-input v-model="delveGridKey" class="w-48" />
      </div>
    </div>
    <div class="mb-8">
      <div class="flex">
        <div class="flex-1">{{ t('Stash tab scrolling') }}</div>
        <div class="flex">
          <ui-radio v-model="stashScroll" :value="true" class="mr-4 font-fontin-regular">Ctrl + MouseWheel</ui-radio>
          <ui-radio v-model="stashScroll" :value="false">{{ t('Disabled') }}</ui-radio>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from './utils'
import { PriceCheckWidget } from '@/web/overlay/interfaces'
import HotkeyInput from './HotkeyInput.vue'

export default defineComponent({
  components: { HotkeyInput },
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      isEnglish: computed(() => props.config.language === 'en'),
      stashScroll: configModelValue(() => props.config, 'stashScroll'),
      delveGridKey: configModelValue(() => props.config, 'delveGridKey'),
      craftOfExileKey: configModelValue(() => props.config, 'craftOfExileKey'),
      itemCheckKey: configModelValue(() => props.config, 'itemCheckKey'),
      wikiKey: configModelValue(() => props.config, 'wikiKey'),
      overlayKey: configModelValue(() => props.config, 'overlayKey'),
      priceCheckHotkeyHold: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkeyHold'),
      priceCheckHotkey: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkey'),
      priceCheckHotkeyLocked: configModelValue(() => findWidget<PriceCheckWidget>('price-check', props.config)!, 'hotkeyLocked')
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "You can clear hotkey by pressing Backspace": "Вы можете отключить сочетание, нажав клавишу Backspace",
    "Price check": "Прайс-чек",
    "Auto-hide Mode": "Режим авто-скрытия",
    "Open without auto-hide": "Открыть без авто-скрытия",
    "Overlay": "Оверлей",
    "Open item on wiki": "Открыть предмет в вики",
    "Map check": "Проверка карты",
    "Item info": "Проверка предмета",
    "Stash tab scrolling": "Прокрутка вкладок тайника",
    "Delve grid": "Сетка \"Спуска\""
  }
}
</i18n>
