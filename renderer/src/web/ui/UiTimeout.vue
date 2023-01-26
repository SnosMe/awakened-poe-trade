<template>
  <div :class="$style.bar" />
</template>

<script lang="ts">
import { defineComponent, computed, shallowRef } from 'vue'
import { useRafFn } from '@vueuse/core'

export default defineComponent({
  name: 'UiTimeout',
  emits: ['timeout'],
  props: {
    ms: {
      type: Number,
      required: true
    }
  },
  setup (props, ctx) {
    const elapsed = shallowRef(0)

    let endAt = performance.now()
    const controls = useRafFn(({ timestamp }) => {
      const delta = timestamp - endAt
      elapsed.value += delta
      endAt = timestamp
      if (elapsed.value >= props.ms) {
        elapsed.value = props.ms
        controls.pause()
        ctx.emit('timeout')
      }
    }, { immediate: true })

    function reset () {
      elapsed.value = 0
      if (!controls.isActive.value) {
        endAt = performance.now()
        controls.resume()
      }
    }

    return {
      reset,
      right: computed(() => `${100 * elapsed.value / props.ms}%`)
    }
  }
})
</script>

<style lang="postcss" module>
.bar {
  @apply bg-gray-800 rounded w-64 h-1;
  position: relative;
  overflow: hidden;

  &::after {
    @apply bg-gray-400 rounded;
    height: 100%;
    width: 100%;
    position: absolute;
    content: '';
    right: v-bind(right);
    top: 0;
  }
}
</style>
