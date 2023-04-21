<template>
  <button
    @click="updateInput"
    :class="$style['checkbox']">
    <i v-if="!modelValue" class="far fa-square"></i>
    <i v-else class="fas fa-check-square"></i>
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UiCheckbox',
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
.checkbox {
  display: flex;
  @apply gap-x-1;
  align-items: baseline;
  text-align: left;
}
</style>
