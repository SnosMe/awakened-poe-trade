<template>
  <div :class="[$style.rollOptions, {
    [$style.filterChecked]: !filter.disabled,
    [$style.alwaysChecked]: (showChecked === 'always')
  }]">
    <button v-for="option of options" :key="option.value" type="submit"
      @click="handleOptionClick($event, option.value)"
      :class="[$style.rollOption, {
        [$style.checked]: option.value === filter.option!.value
      }]">{{ option.text }}</button>
  </div>
</template>

<script setup lang="ts">
import type { StatFilter } from './interfaces'

export interface RollOption {
  text: string
  value: number
}

const props = defineProps<{
  filter: StatFilter
  options: RollOption[]
  showChecked: 'always' | 'currentDisabled'
}>()

function handleOptionClick (e: MouseEvent, value: number) {
  if (e.detail === 0) return
  e.preventDefault()

  if (value === props.filter.option!.value) {
    props.filter.disabled = !props.filter.disabled
  } else {
    props.filter.option!.value = value
    props.filter.disabled = false
  }
}
</script>

<style lang="postcss" module>
.rollOptions {
  display: flex;
  align-items: baseline;
  gap: theme('spacing.1');
}

.rollOption {
  background: theme('colors.gray.700');
  color: theme('colors.gray.400');
  padding: 0 theme('spacing.2');
  border: 1px solid transparent;
  min-width: theme('width.10');
  text-align: center;
  white-space: nowrap;
  line-height: 1.125rem;
  border-radius: theme('borderRadius.DEFAULT');

  .alwaysChecked > &.checked {
    border-style: dashed;
    border-color: theme('colors.gray.500');
  }

  .filterChecked > &.checked {
    border-style: solid;
    color: theme('colors.gray.300');
    border-color: theme('colors.gray.500');
  }
}
</style>
