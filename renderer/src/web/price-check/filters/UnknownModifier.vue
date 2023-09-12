<template>
  <div class="py-2 border-b border-gray-700 flex flex-col">
    <div class="pb-1 flex items-baseline">
      <i class="w-5 shrink-0 fas fa-exclamation-triangle text-orange-400"></i>
      <div class="search-text mr-1 relative flex min-w-0" style="line-height: 1rem;">
        <span class="truncate"><ItemModifierText :text="stat.text" /></span>
        <span class="search-text-full whitespace-pre-wrap cursor-default"><ItemModifierText :text="stat.text" /></span>
      </div>
    </div>
    <div class="ml-5 text-xs leading-none">
      <span class="text-gray-600">{{ t(stat.type) }} &mdash; </span>
      <span class="text-orange-400">{{ t('Not recognized modifier') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ParsedItem } from '@/parser'

import ItemModifierText from '../../ui/ItemModifierText.vue'

defineProps<{
  stat: ParsedItem['unknownModifiers'][number]
}>()

const { t } = useI18n()
</script>
