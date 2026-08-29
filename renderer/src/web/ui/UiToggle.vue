<template>
  <button @click="updateInput" :class="$style.toggle">
    <i v-if="modelValue" class="fas fa-toggle-on pr-1 text-gray-300"></i>
    <i v-else class="fas fa-toggle-off pr-1 text-gray-600"></i>
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UiToggle',
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  setup (props, ctx) {
    return {
      updateInput () {
        ctx.emit('update:modelValue', !props.modelValue)
      }
    }
  }
})
</script>

<style lang="postcss" module>
.toggle {
  display: flex;
  align-items: center;
  height: 1.375rem;

  &:disabled, &:disabled > i {
    @apply text-gray-600;
  }
}
</style>
