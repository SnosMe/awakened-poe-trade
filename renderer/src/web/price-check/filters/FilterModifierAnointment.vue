<template>
  <item-quick-price v-if="result"
    :price="result.price"
    currency-text
  >
    <template #item>
      <div class="flex">
        <img v-for="icon in result.icons" class="w-8 h-8" :src="icon">
      </div>
    </template>
  </item-quick-price>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { StatFilter } from './interfaces'
import { autoCurrency, findPriceByQueryId } from '@/web/background/Prices'
import { BLIGHT_RECIPES, ITEM_BY_REF } from '@/assets/data'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'

export default defineComponent({
  components: { ItemQuickPrice },
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    }
  },
  setup (props) {
    const result = computed(() => {
      if (props.filter.statRef !== 'Allocates #') return null

      const roll = props.filter.option!.value

      const oils = (BLIGHT_RECIPES.recipes[roll] ?? [])
        .map(idx => BLIGHT_RECIPES.oils[idx])
        .map(oilName => ITEM_BY_REF('ITEM', oilName)?.[0])
      if (!oils.length) return null

      let totalChaos: number | undefined = 0
      for (const oil of oils) {
        if (!oil) return null
        const price = findPriceByQueryId(`ITEM::${oil.refName}`)
        if (price) {
          totalChaos += price.chaosValue
        } else {
          totalChaos = undefined
          break
        }
      }

      return {
        icons: oils.map(item => item!.icon),
        price: (totalChaos != null)
          ? autoCurrency(totalChaos, 'chaos')
          : undefined
      }
    })

    return { result }
  }
})
</script>
