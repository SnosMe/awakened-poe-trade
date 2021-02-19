<template>
  <component :is="tagName" ref="target" v-bind="$attrs">
    <slot name="target" />
  </component>
  <div ref="content">
    <slot name="content" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, PropType } from 'vue'
import tippy, { Instance, Placement } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

export default defineComponent({
  name: 'UiPopover',
  inheritAttrs: false,
  props: {
    trigger: {
      type: String,
      default: undefined
    },
    boundary: {
      type: String,
      default: undefined
    },
    placement: {
      type: String as PropType<Placement>,
      default: undefined
    },
    arrow: {
      type: Boolean,
      default: true
    },
    delay: {
      type: [Array, Number] as PropType<number | [number | null, number | null]>,
      default: 0
    },
    tagName: {
      type: String,
      default: 'span'
    }
  },
  setup (props) {
    const target = ref<HTMLElement>(null!)
    const content = ref<HTMLElement>(null!)
    let instance: Instance

    onMounted(() => {
      instance = tippy(target.value, {
        content: content.value,
        interactive: true,
        theme: 'light',
        trigger: props.trigger,
        placement: props.placement,
        arrow: props.arrow,
        delay: props.delay,
        popperOptions: {
          modifiers: [
            ...(props.boundary
              ? [{
                  name: 'preventOverflow',
                  options: {
                    boundary: document.querySelector(props.boundary)
                  }
                }]
              : [])
          ]
        }
      })
    })

    onBeforeUnmount(() => {
      instance.destroy()
    })

    return {
      target,
      content
    }
  }
})
</script>

<style lang="postcss">
.tippy-box {
  @apply rounded;
}

.tippy-content {
  @apply p-1;
}
</style>
