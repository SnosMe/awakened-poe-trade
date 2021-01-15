<template>
  <div class="titlebar" :class="{ 'native': native }">
    <slot />
    <div class="text-gray-600 truncate leading-none px-4">{{ title }}</div>
    <div class="flex">
      <button @click.stop="$emit('close')" tabindex="-1"
        class="titlebar-btn app-close pt-px" title="Close"><i class="fas fa-window-close"></i></button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AppTitlebar',
  props: {
    title: {
      type: String,
      default: ''
    },
    native: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="postcss">
.titlebar {
  @apply bg-gray-900;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 1.5rem;

  /* https://electronjs.org/docs/api/frameless-window */
  &.native {
    -webkit-app-region: drag;
    user-select: none;
  }
}

.titlebar-btn {
  -webkit-app-region: no-drag;
  @apply text-gray-600;
  line-height: 1.5rem;
  height: 1.5rem;
  @apply px-2;

  &:hover {
    @apply text-gray-500;
  }

  &.app-close {
    &:hover {
      @apply text-red-200 bg-red-500;
    }
  }
}
</style>
