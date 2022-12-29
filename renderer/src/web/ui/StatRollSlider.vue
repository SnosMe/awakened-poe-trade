<template>
  <div class="flex justify-between bg-gray-700 rounded relative p-0.5 items-center h-5"
    ref="rootEl"
    :class="$style[state.mode]"
    @mousedown="handleMousedown">
    <span :class="[$style.bound, { [$style.inclusive]: state.minInclusive }]">{{ bounds.min }}</span>
    <div v-if="state.mode !== 'none'"
      :class="[$style.fill]"
      :style="{ '--left': `${state.percentLeft}%`, '--right': `${state.percentRight}%` }"
    />
    <div :class="$style.tick" :style="{ 'left': `max(0.125rem, min(${percentRoll}% - 0.0625rem, 100% - 0.25rem))` }" />
    <div v-if="popupValue"
      :class="$style.popup"
      :style="{ '--left': `${state.percentLeft}%`, '--right': `${state.percentRight}%` }"
    >{{ popupValue }}</div>
    <span :class="[$style.bound, { [$style.inclusive]: state.maxInclusive }]">{{ bounds.max }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, shallowRef } from 'vue'
import { percentRoll } from '../price-check/filters/util'

export default defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<Array<number | '' | undefined>>,
      required: true
    },
    roll: { type: Number, required: true },
    dp: { type: Boolean, required: true },
    bounds: {
      type: Object as PropType<{ min: number, max: number }>,
      required: true
    }
  },
  setup (props, ctx) {
    const rootEl = shallowRef<HTMLDivElement>(null!)

    const dirty = shallowRef<typeof props['modelValue'] | null>(null)

    const state = computed(() => {
      const min = (dirty.value) ? dirty.value[0] : props.modelValue[0]
      const max = (dirty.value) ? dirty.value[1] : props.modelValue[1]
      const { bounds } = props
      if (typeof min === 'number' && typeof max !== 'number') {
        return {
          mode: 'min',
          percentLeft: (min - bounds.min) / (bounds.max - bounds.min) * 100,
          maxInclusive: true
        }
      } else if (typeof min !== 'number' && typeof max === 'number') {
        return {
          mode: 'max',
          percentRight: (bounds.max - max) / (bounds.max - bounds.min) * 100,
          minInclusive: true
        }
      } else if (typeof min === 'number' && typeof max === 'number') {
        if (min > max) return { mode: 'none' }
        return {
          mode: 'range',
          percentLeft: (min - bounds.min) / (bounds.max - bounds.min) * 100,
          percentRight: (bounds.max - max) / (bounds.max - bounds.min) * 100,
          minInclusive: (min <= bounds.min),
          maxInclusive: (max >= bounds.max)
        }
      } else {
        return { mode: 'none' }
      }
    })

    function handleMousemove (e: MouseEvent) {
      e.preventDefault()
      const { bounds, dp } = props
      const rect = rootEl.value.getBoundingClientRect()
      const k = Math.max(0, Math.min((e.clientX - rect.x) / rect.width, 1))
      const value = (bounds.max - bounds.min) * k + bounds.min
      if (state.value.mode === 'min') {
        dirty.value = [percentRoll(value, -0, Math.floor, dp), undefined]
      } else if (state.value.mode === 'max') {
        dirty.value = [undefined, percentRoll(value, +0, Math.ceil, dp)]
      }
    }
    function removeMousemove () {
      document.removeEventListener('mousemove', handleMousemove)
      document.removeEventListener('mouseup', removeMousemove)
      window.removeEventListener('blur', removeMousemove)
      ctx.emit('update:modelValue', dirty.value)
      dirty.value = null
    }

    return {
      rootEl,
      percentRoll: computed(() => {
        const { bounds } = props
        return (props.roll - bounds.min) / (bounds.max - bounds.min) * 100
      }),
      popupValue: computed(() => state.value.mode === 'min' ? dirty.value?.[0] : dirty.value?.[1]),
      handleMousedown (e: MouseEvent) {
        if (state.value.mode !== 'min' && state.value.mode !== 'max') return
        handleMousemove(e)
        document.addEventListener('mousemove', handleMousemove)
        document.addEventListener('mouseup', removeMousemove)
        window.addEventListener('blur', removeMousemove)
      },
      state
    }
  }
})
</script>

<style lang="postcss" module>
.tick {
  position: absolute;
  @apply w-0.5;
  background: linear-gradient(to bottom, #000 10%, transparent 30%, transparent 70%, #000 90%);
  height: 100%;
  pointer-events: none;
}
.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  @apply rounded;
  padding: inherit;
  background-clip: content-box;
  min-width: 0.75rem;
  pointer-events: none;

  .min & {
    width: calc(100% - var(--left));
    right: 0;
    background-image: linear-gradient(to right, transparent calc(-1 * var(--left) - 5%), theme('colors.gray.400') 80%);
  }

  .max & {
    width: calc(100% - var(--right));
    left: 0;
    background-image: linear-gradient(to left, transparent calc(-1 * var(--right) - 5%), theme('colors.gray.400') 80%);
  }

  .range & {
    left: var(--left);
    right: var(--right);
    background-color: theme('colors.gray.400');
  }
}

.bound {
  line-height: none;
  z-index: 1;
  @apply text-gray-500;
  pointer-events: none;
  user-select: none;

  &.inclusive { @apply text-black; }

  &:first-child { @apply pl-1; }
  &:last-child { @apply pr-1; }
}

.popup {
  position: absolute;
  @apply bg-blue-600;
  @apply px-1 mb-1;
  @apply rounded;
  bottom: 100%;
  min-width: 1.8rem;
  text-align: center;

  left: calc(var(--left) - 0.8rem);
  right: calc(var(--right) - 0.8rem);
}
</style>
