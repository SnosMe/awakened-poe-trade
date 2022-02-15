<template>
  <div class="flex items-center overflow-hidden gap-x-1">
    <slot name="item">
      <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <img :src="itemImg" class="max-w-full max-h-full overflow-hidden">
      </div>
    </slot>
    <i class="fas fa-arrow-right text-gray-600 px-1 text-sm"></i>
    <div class="whitespace-nowrap">
      <span v-if="approx && !isRange" class="text-gray-600 font-sans">~ </span>
      <span :class="{ [$style.exalted]: isExa }">{{ minText }}</span>
      <span v-if="isRange" class="text-gray-600 font-sans"> ~ </span>
      <span v-if="isRange" :class="{ [$style.exalted]: isExa }">{{ maxText }}</span>
      <span v-if="!currencyText" class="font-sans" :class="{ [$style.exalted]: isExa }"> ×</span>
      <span v-else-if="price" :class="{ [$style.exalted]: isExa }">&nbsp;{{ price.currency }}</span>
    </div>
    <div class="w-8 h-8 flex items-center justify-center flex-shrink-0" v-if="!currencyText">
      <img v-if="isExa" src="/images/exa.png" class="max-w-full max-h-full">
      <img v-else src="/images/chaos.png" class="max-w-full max-h-full">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { displayRounding } from '../background/Prices'

export default defineComponent({
  props: {
    price: {
      type: Object as PropType<{ min: number, max: number, currency: 'exa' | 'chaos' }>,
      default: undefined
    },
    approx: {
      type: Boolean,
      default: false
    },
    fraction: {
      type: Boolean,
      default: false
    },
    itemImg: {
      type: String,
      default: '/images/wisdom.png'
    },
    currencyText: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    const minText = computed(() => (props.price) ? displayRounding(props.price.min, props.fraction) : '?')
    const maxText = computed(() => (props.price) ? displayRounding(props.price.max, props.fraction) : '?')

    return {
      minText,
      maxText,
      isRange: computed(() => { return minText.value !== maxText.value }),
      isExa: computed(() => { return props.price?.currency === 'exa' })
    }
  }
})
</script>

<style module>
.exalted {
  color: #e4c29a;
}
</style>
