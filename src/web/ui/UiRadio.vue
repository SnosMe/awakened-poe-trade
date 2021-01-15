<template>
  <button
    @click="updateInput"
    class="ui-radio">
    <i v-if="!isChecked" class="far fa-circle mr-1"></i>
    <i v-else class="fas fa-check-circle mr-1"></i>
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'UiRadio',
  emits: ['update:modelValue'],
  props: {
    value: {
      type: null,
      required: true
    },
    modelValue: {
      type: null,
      required: true
    }
  },
  setup (props, ctx) {
    return {
      isChecked: computed(() => {
        return props.modelValue === props.value
      }),
      updateInput () {
        ctx.emit('update:modelValue', props.value)
      }
    }
  }
})
</script>
