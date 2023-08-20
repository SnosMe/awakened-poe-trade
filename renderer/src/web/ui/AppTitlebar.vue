<template>
  <div :class="$style.titlebar">
    <slot />
    <button @click="emit('click')" class="truncate">{{ title }}</button>
    <button @click.stop="emit('close')" tabindex="-1"
      :class="[$style.button, $style.close]" title="Close"><i class="fas fa-window-close"></i></button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'close'): void
}>()
</script>

<style lang="postcss" module>
.titlebar {
  @apply bg-gray-900 text-gray-600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 1.5rem;
  line-height: 1.5rem;

  button {
    @apply px-2 pt-px;

    &:hover {
      @apply text-gray-400;
      background: linear-gradient(to top, theme('colors.gray.900'), theme('colors.gray.700'))
    }

    &.close:hover {
      @apply text-red-200;
      background: theme('colors.red.500');
    }
  }
}
</style>
