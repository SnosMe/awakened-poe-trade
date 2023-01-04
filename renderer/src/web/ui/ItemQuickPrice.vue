<template>
  <div class="flex items-center gap-x-1">
    <slot name="item">
      <div class="flex items-center justify-center shrink-0" :class="imgSize">
        <img :src="itemImg" class="max-w-full max-h-full overflow-hidden">
      </div>
    </slot>
    <i class="fas fa-arrow-right text-gray-600 px-1 text-sm"></i>
    <div class="whitespace-nowrap overflow-hidden">
      <span v-if="approx && !isRange" class="text-gray-600 font-sans">~ </span>
      <span :class="{ [$style.golden]: isValuable, 'px-1': (minText === '?') }">{{ minText }}</span>
      <span v-if="isRange" class="text-gray-600 font-sans"> ~ </span>
      <span v-if="isRange" :class="{ [$style.golden]: isValuable }">{{ maxText }}</span>
      <span v-if="!currencyText" class="font-sans" :class="{ [$style.golden]: isValuable }"> ×</span>
      <span v-else-if="price" :class="{ [$style.golden]: isValuable }">&nbsp;{{ price.currency }}</span>
    </div>
    <div class="w-8 h-8 flex items-center justify-center shrink-0" v-if="!currencyText">
      <img v-if="isValuable" src="/images/divine.png" class="max-w-full max-h-full">
      <img v-else src="/images/chaos.png" class="max-w-full max-h-full">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { displayRounding } from '../background/Prices'
import { ITEM_BY_REF, BaseType } from '@/assets/data'

export default defineComponent({
  props: {
    price: {
      type: Object as PropType<{ min: number, max: number, currency: 'div' | 'chaos' }>,
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
    },
    itemBase: {
      type: Object as PropType<BaseType>,
      default: undefined
    }
  },
  setup (props) {
    const minText = computed(() => (props.price) ? displayRounding(props.price.min, props.fraction) : '?')
    const maxText = computed(() => (props.price) ? displayRounding(props.price.max, props.fraction) : '?')

    const imgSize = computed(() => {
      if (!props.itemBase) return 'w-8 h-8'

      const base = (props.itemBase.unique)
        ? ITEM_BY_REF('ITEM', props.itemBase.unique.base)![0]
        : props.itemBase

      const width = base.w ?? 1
      const height = base.h ?? 1

      if (height > 1) {
        return 'w-8 h-10 -my-1'
      } else if (width > 1) {
        return 'w-12 h-8'
      } else {
        return 'w-8 h-8'
      }
    })

    return {
      minText,
      maxText,
      imgSize,
      isRange: computed(() => { return minText.value !== maxText.value }),
      isValuable: computed(() => { return props.price?.currency === 'div' })
    }
  }
})
</script>

<style module>
.golden {
  color: #e4c29a;
}
</style>
