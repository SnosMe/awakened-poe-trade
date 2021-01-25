<template>
  <div v-if="result"
    class="flex items-center">
    <img v-for="icon in result.icons" class="w-8 h-8" :src="icon">
    <span><i class="fas fa-arrow-right text-gray-600 px-2"></i>{{ result.price }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { StatFilter } from './interfaces'
import { autoCurrency, displayRounding, findByDetailsId, ItemInfo } from '@/web/background/Prices'
import { nameToDetailsId } from '../trends/getDetailsId'
import { BlightRecipes } from '@/assets/data/interfaces'

const RECIPES = require('@/assets/data/blight-recipes.json') as BlightRecipes

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    }
  },
  setup (props) {
    const result = computed(() => {
      if (props.filter.statRef !== 'Allocates #') return null

      const roll = props.filter.roll!

      const oils = (RECIPES.recipes[roll] ?? []).map(idx => RECIPES.oils[idx])
      if (!oils.length) return null

      const prices = oils
        .map(nameToDetailsId)
        .map(findByDetailsId)
        .filter(Boolean) as ItemInfo[]

      if (prices.length !== oils.length) return null

      const totalChaos = prices.reduce((t, p) => t + p.receive.chaosValue, 0)
      const total = autoCurrency(totalChaos, 'c')

      return {
        icons: prices.map(p => p.icon),
        price: `${displayRounding(total.val)} ${total.curr === 'c' ? 'chaos' : 'exa'}`
      }
    })

    return {
      result
    }
  }
})
</script>
