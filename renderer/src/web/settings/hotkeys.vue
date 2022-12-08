<template>
  <div class="max-w-md p-2">
    <div class="mb-2 bg-gray-700 rounded px-2 py-1 leading-none">
      <i class="fas fa-info-circle"></i> {{ t('You can clear hotkey by pressing Backspace') }}
    </div>
    <div class="mb-8 flex flex-col">
      <label class="mb-1">{{ t('Price check') }}</label>
      <div class="flex flex-col gap-y-2 pl-4">
        <div class="flex gap-x-2">
          <label class="flex-1 text-gray-500">{{ t('Auto-hide Mode') }}</label>
          <div class="flex w-48 gap-x-1">
            <button :class="{ 'border-transparent': priceCheckHotkeyHold !== 'Ctrl', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Ctrl'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 border leading-none">Ctrl</button>
            <button :class="{ 'border-transparent': priceCheckHotkeyHold !== 'Alt', 'line-through': priceCheckHotkey === null }" @click="priceCheckHotkeyHold = 'Alt'; priceCheckHotkey = null" class="rounded px-1 bg-gray-900 border leading-none">Alt</button>
            <span class="flex-1 text-center">+</span>
            <hotkey-input v-model="priceCheckHotkey" class="w-20" no-mod-keys />
          </div>
        </div>
        <div class="flex gap-x-2">
          <label class="flex-1 text-gray-500">{{ t('Open without auto-hide') }}</label>
          <hotkey-input v-model="priceCheckHotkeyLocked" class="w-48" />
        </div>
      </div>
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Overlay') }} <span class="text-red-500 text-lg leading-none">*</span></label>
      <hotkey-input required v-model="overlayKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Open item on wiki') }}</label>
      <hotkey-input v-model="wikiKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Map check') }}</label>
      <hotkey-input v-model="itemCheckKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Item info') }}</label>
      <hotkey-input v-model="itemCheckKey" class="w-48" />
    </div>
    <div v-if="isEnglish" class="mb-4 flex">
      <label class="flex-1">Open base item on Craft of Exile</label>
      <hotkey-input v-model="craftOfExileKey" class="w-48" />
    </div>
    <div class="mb-8 flex">
      <label class="flex-1">{{ t('Delve grid') }}</label>
      <hotkey-input v-model="delveGridKey" class="w-48" />
    </div>
    <div class="mb-8 flex">
      <label class="flex-1">{{ t('Stash tab scrolling') }}</label>
      <div class="flex gap-x-4">
        <ui-radio v-model="stashScroll" :value="true" class="font-poe">Ctrl + MouseWheel</ui-radio>
        <ui-radio v-model="stashScroll" :value="false">{{ t('Disabled') }}</ui-radio>
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
  name: 'Hotkeys',
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
  },
  "zh_CN": {
    "You can clear hotkey by pressing Backspace": "你可以使用 Backspace(回退键) 来清除快捷键。",
    "Price check": "查询价格",
    "Auto-hide Mode": "自动隐藏模式",
    "Open without auto-hide": "一般模式",
    "Overlay": "Overlay",
    "Open item on wiki": "开启wiki页面",
    "Map check": "检查地图",
    "Item info": "物品资讯",
    "Stash tab scrolling": "切换仓库页",
    "Delve grid": "矿坑网格"
  },
  "cmn-Hant": {
    "You can clear hotkey by pressing Backspace": "你可以使用 Backspace(倒退鍵) 來清除快捷鍵。",
    "Price check": "查詢價格",
    "Auto-hide Mode": "自動隱藏模式",
    "Open without auto-hide": "一般模式",
    "Overlay": "Overlay",
    "Open item on wiki": "開啟wiki頁面",
    "Map check": "檢查地圖",
    "Item info": "物品資訊",
    "Stash tab scrolling": "切換倉庫頁",
    "Delve grid": "礦坑網格"
  }
}
</i18n>
