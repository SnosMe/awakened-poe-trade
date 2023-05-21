<template>
  <button
    @click="updateInput"
    :class="$style['checkbox']">
    <i v-if="modelValue !== values[0]" class="far fa-square"></i>
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
    modelValue: {},
    values: {
      type: Array,
      default: [true, false]
    }
  },
  setup (props, ctx) {
    return {
      updateInput () {
        const [on, off] = props.values
        ctx.emit('update:modelValue', (props.modelValue === on) ? off : on)
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
