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
  (e: 'click' | 'close'): void
}>()
</script>

<style lang="postcss" module>
.titlebar {
  @apply bg-surface-base text-content-muted;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 1.5rem;
  line-height: 1.5rem;

  button {
    @apply px-2 pt-px;

    &:hover {
      @apply text-content-muted;
      background: linear-gradient(to top, rgb(var(--c-surface-base)), rgb(var(--c-surface-hover)))
    }

    &.close:hover {
      @apply text-content-primary;
      background: rgb(var(--c-danger));
    }
  }
}
</style>
