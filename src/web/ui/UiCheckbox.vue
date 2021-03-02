<template>
    <button
        @click="updateInput"
        class="ui-radio mr-2">
        <i v-if="!modelValue" class="far fa-circle mr-1"></i>
        <i v-else class="fas fa-check-circle mr-1"></i>
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
