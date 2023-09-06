<template>
  <div class="flex gap-1 items-center text-xl">
    <template v-for="currency in formattedCurrencies">
      {{ currency.amount }}
      <img :src="currency.image" :alt="currency.name" class="h-7 w-7">
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'

const props = defineProps({
  amount: {
    type: Number,
    required: true
  },
  currencies: {
    type: Array as PropType<{ name: string, value: number, image: string }[]>,
    required: true
  },
  roundPrecision: {
    type: Number,
    default: 0
  }
})

const formattedCurrencies = computed(() => {
  let remaining = props.amount
  return props.currencies
    .sort((a, b) => b.value - a.value)
    .map(({ name, value, image }, index) => {
      let amount = remaining / value

      if (index === props.currencies.length - 1) {
        amount = +amount.toFixed(props.roundPrecision)
      } else {
        amount = Math.trunc(amount)
        remaining -= amount * value
      }

      return { name, amount, image }
    })
})
</script>