<template>
  <div class="max-w-md p-2">
    <div class="mb-4 flex">
      <label class="flex-1">{{ t('Perform an OCR for a Skill Gem') }}</label>
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
  name: 'Item search',
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

<i18n>
{
  "ru": {
    "Perform an OCR for a Skill Gem": "Выполнить OCR для гема"
  }
}
</i18n>
