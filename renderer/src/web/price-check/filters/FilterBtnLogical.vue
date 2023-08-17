<template>
  <button :class="[$style.btn, { [$style.active]: (active != null) ? active : !filter.disabled }]"
    @click="toggle"
  >
    <img v-if="img" :src="img" class="w-5 h-5">
    <span class="pl-1">{{ t(text) }}</span>
    <i v-if="collapse" class="pl-2 text-xs text-gray-400"
      :class="filter.disabled ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" />
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  filter: { disabled: boolean } // will be mutated directly, instead of emit
  text: string
  img?: string
  readonly?: boolean
  active?: boolean
  collapse?: boolean
}>()

const { t } = useI18n()

function toggle () {
  const { filter, readonly } = props
  if (!readonly) {
    filter.disabled = !filter.disabled
  }
}
</script>

<style lang="postcss" module>
.btn {
  @apply bg-gray-900 rounded;
  @apply border border-transparent;
  @apply pl-1 pr-2;
  line-height: 1.25rem;
  display: flex;
  align-items: center;

  &.active {
    @apply border-gray-500;
  }
}
</style>
