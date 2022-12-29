<template>
  <div class="py-2 border-b border-gray-700 flex flex-col">
    <div class="pb-1 flex items-baseline">
      <i class="w-5 shrink-0 fas fa-exclamation-triangle text-orange-400"></i>
      <div class="search-text mr-1 relative flex min-w-0" style="line-height: 1rem;">
        <span class="truncate"><item-modifier-text :text="stat.text" /></span>
        <span class="search-text-full whitespace-pre-wrap cursor-default"><item-modifier-text :text="stat.text" /></span>
      </div>
    </div>
    <div class="ml-5 text-xs leading-none">
      <span class="text-gray-600">{{ t(stat.type) }} &mdash; </span>
      <span class="text-orange-400">{{ t('Not recognized modifier') }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemModifierText from '../../ui/ItemModifierText.vue'
import { ParsedItem } from '@/parser'

export default defineComponent({
  components: { ItemModifierText },
  props: {
    stat: {
      type: Object as PropType<ParsedItem['unknownModifiers'][number]>,
      required: true
    }
  },
  setup () {
    const { t } = useI18n()

    return {
      t
    }
  }
})
</script>
