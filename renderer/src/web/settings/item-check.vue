<template>
  <div class="max-w-md p-2">
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Open item on wiki') }}</label>
      <hotkey-input v-model="wikiKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Open item on PoEDB') }}</label>
      <hotkey-input v-model="poedbKey" class="w-48" />
    </div>
    <div v-if="isEnglish" class="mb-4 flex">
      <label class="flex-1">Open base item on Craft of Exile</label>
      <hotkey-input v-model="craftOfExileKey" class="w-48" />
    </div>
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Stash search') }}</label>
      <hotkey-input v-model="stashSearchKey" class="w-48" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from './utils'
import { ItemCheckWidget } from '@/web/overlay/interfaces'
import HotkeyInput from './HotkeyInput.vue'

export default defineComponent({
  name: 'Item info',
  components: { HotkeyInput },
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      isEnglish: computed(() => props.config.language === 'en'),
      wikiKey: configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'wikiKey'),
      poedbKey: configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'poedbKey'),
      craftOfExileKey: configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'craftOfExileKey'),
      stashSearchKey: configModelValue(() => findWidget<ItemCheckWidget>('item-check', props.config)!, 'stashSearchKey')
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Open item on wiki": "Открыть предмет в вики",
    "Open item on PoEDB": "Открыть предмет в PoEDB",
    "Stash search": "Поиск в тайнике"
  },
  "cmn-Hant": {
    "Open item on wiki": "開啟wiki頁面"
  }
}
</i18n>
