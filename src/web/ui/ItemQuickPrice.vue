<template>
  <div class="flex items-center justify-center">
    <slot name="item">
      <div class="w-8 h-8 flex items-center justify-center">
        <img :src="itemImg" class="max-w-full max-h-full overflow-hidden">
      </div>
    </slot>
    <!-- <span class="px-1 text-base" v-if="item.stackSize"><span class="font-sans">×</span> 1</span> -->
    <i class="fas fa-arrow-right text-gray-600 px-2"></i>
    <div class="px-1 text-base">
      <span v-if="approx && !isRange" class="text-gray-600 font-sans">~ </span>
      <span :class="{ [$style.exalted]: isExa }">{{ minText }}</span>
      <span v-if="isRange" class="text-gray-600 font-sans"> ~ </span>
      <span v-if="isRange" :class="{ [$style.exalted]: isExa }">{{ maxText }}</span>
      <span class="font-sans" :class="{ [$style.exalted]: isExa }"> ×</span>
    </div>
    <div class="w-8 h-8 flex items-center justify-center">
      <img v-if="isExa" src="@/assets/images/exa.png" class="max-w-full max-h-full">
      <img v-else src="@/assets/images/chaos.png" class="max-w-full max-h-full">
    </div>
  </div>
</template>

<script>
import { displayRounding } from '../price-check/Prices'

export default {
  props: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
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
      default: require('@/assets/images/wisdom.png')
    }
  },
  computed: {
    isExa () { return this.currency === 'exa' },
    minText () { return displayRounding(this.min, this.fraction) },
    maxText () { return displayRounding(this.max, this.fraction) },
    isRange () { return this.minText !== this.maxText }
  }
}
</script>

<style module>
.exalted {
  color: #e4c29a;
}
</style>
