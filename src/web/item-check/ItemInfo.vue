<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': `min(${wm.width - wm.poeUiWidth}px, 30rem)` }">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ itemName }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ParsedItem } from '@/parser'
import { TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
import { WidgetManager } from '../overlay/interfaces'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    const itemName = computed(() => {
      const { item } = props
      if (item.rarity === ItemRarity.Unique) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.name || item.baseType)
      } else {
        return TRANSLATED_ITEM_NAME_BY_REF.get(item.baseType || item.name)
      }
    })

    return {
      t,
      wm,
      itemName
    }
  }
})
</script>

<i18n>
{
  "ru": {
  }
}
</i18n>
