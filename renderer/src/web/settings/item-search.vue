<template>
  <div class="max-w-md p-2">
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('item_search.ocr_gems_key') }}</label>
      <hotkey-input v-model="ocrGemsKey" class="w-48" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp, configModelValue, findWidget } from './utils'
import { ItemSearchWidget } from '@/web/overlay/interfaces'
import HotkeyInput from './HotkeyInput.vue'

export default defineComponent({
  name: 'item_search.name',
  components: { HotkeyInput },
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      ocrGemsKey: configModelValue(() => findWidget<ItemSearchWidget>('item-search', props.config)!, 'ocrGemsKey')
    }
  }
})
</script>
