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
import { usePoeninja } from '@/web/background/Prices'
import { ITEM_BY_REF } from '@/assets/data'
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
    const { findPriceByQuery, autoCurrency } = usePoeninja()

    const result = computed(() => {
      if (!props.filter.oils) return null

      const oils = props.filter.oils
        .map(oilName => ITEM_BY_REF('ITEM', oilName)![0])

      let totalChaos: number | undefined = 0
      for (const oil of oils) {
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
        icons: oils.map(item => item!.icon),
        price: (totalChaos != null)
          ? autoCurrency(totalChaos)
          : undefined
      }
    })

    return { result }
  }
})
</script>
