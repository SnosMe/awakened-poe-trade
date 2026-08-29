<template>
  <div class="p-2 border-dashed border border-gray-600 rounded mt-2 text-gray-400 leading-none">
    {{ t('item.disenchanting') }} <i class="fas fa-arrow-right text-gray-600 px-1 text-xs"></i> {{ item.dustEquivalent!.toLocaleString() }} <span class="font-sans">×</span> <img src="/images/dust.png" class="w-5 -my-5 inline-block" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ParsedItem } from '@/parser'

defineProps<{
  item: ParsedItem
}>()

const { t } = useI18n()
</script>
