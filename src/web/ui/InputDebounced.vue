<template>
  <input
    :value="modelValue"
    @input="update"
    @mousewheel="noop">
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { debounce } from 'throttle-debounce'

export default defineComponent({
  name: 'UiInputDebounced',
  emits: ['update:modelValue'],
  props: {
    modelValue: {},
    delay: {
      type: Number,
      default: 350
    }
  },
  setup (props, ctx) {
    return {
      update: debounce(props.delay, (e: InputEvent) => {
        ctx.emit('update:modelValue', (e.target as HTMLInputElement).value)
      }),
      noop () {
        // fix not working mouseScroll
      }
    }
  }
})
</script>
