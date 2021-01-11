<template>
  <div
    ref="el"
    style="position: relative; overflow-y: auto;"
    @scroll.passive="handleScroll"
  >
    <div :style="{ height: `${fullHeight}px` }">
      <slot v-for="entry in renderItems" v-bind="entry" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, triggerRef } from 'vue'

export default defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      required: true
    }
  },
  setup (props) {
    const el = ref<HTMLElement>()

    const renderItems = computed(() => {
      if (!el.value) return []

      const scrollTop = el.value.scrollTop
      const count = Math.floor(el.value.offsetHeight / props.itemHeight) + 2
      const startIdx = Math.floor(scrollTop / props.itemHeight)

      const top = (startIdx * props.itemHeight)

      return props.items
        .slice(startIdx, startIdx + count)
        .map((item, i) =>
          ({
            top: top + (i * props.itemHeight),
            item
          })
        )
    })

    return {
      el,
      renderItems,
      handleScroll () {
        triggerRef(el)
      },
      fullHeight: computed(() => props.items.length * props.itemHeight)
    }
  }
})
</script>
