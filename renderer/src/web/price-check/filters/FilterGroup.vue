<template>
  <div>
    <FilterModifier :key="`${group.meta.tag}_${group.meta.text}`"
      :filter="group.meta"
      :item="item"
      v-model:group-expanded="group.expanded"
      @submit="handleStatsSubmit" />
    <template v-if="group.expanded">
      <FilterModifier v-for="filter of group.stats" :key="`${filter.tag}_${filter.text}`"
        :filter="filter"
        :item="item"
        grouped
        @submit="handleStatsSubmit" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { FilterGroup } from './interfaces'
import { ParsedItem } from '@/parser'

const emit = defineEmits<{
  (e: 'submit'): void
}>()

import FilterModifier from './FilterModifier.vue'

defineProps<{
  group: FilterGroup,
  item: ParsedItem
}>()

function handleStatsSubmit () {
  emit('submit')
}
</script>

<style lang="postcss" module>

</style>
