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
import { autoCurrency, findPriceByQuery } from '@/web/background/Prices'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { BaseType } from '@/assets/data'

export default defineComponent({
  components: { ItemQuickPrice },
  props: {
    oils: {
      type: Object as PropType<BaseType[]>
    }
  },
  setup (props) {
    const result = computed(() => {
      if (!props.oils) return null

      let totalChaos: number | undefined = 0
      for (const oil of props.oils) {
        if (!oil) return null
        const price = findPriceByQuery({ ns: 'ITEM', name: oil.refName, variant: undefined })
        if (price) {
          totalChaos += price.chaos
        } else {
          totalChaos = undefined
          break
        }
      }

      return {
        icons: props.oils.map(item => item!.icon),
        price: (totalChaos != null)
          ? autoCurrency(totalChaos, 'chaos')
          : undefined
      }
    })

    return { result }
  }
})
</script>
