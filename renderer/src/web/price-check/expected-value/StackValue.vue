<template>
  <div v-if="show"
    class="p-2 border-dashed border border-gray-600 rounded mt-2">
    <div class="flex text-gray-400 leading-none">
      <div class="w-1/2"
        >{{ t('trade_result.you_have') }} <span class="font-sans">×</span> {{ value.have.amount }} <i class="fas fa-arrow-right text-gray-600 px-1 text-xs"></i> {{ value.have.price }}</div>
      <div class="w-1/2 pl-2" v-if="value.oneStack"
        >{{ t('trade_result.stack') }} <span class="font-sans">×</span> {{ value.oneStack.amount }} <i class="fas fa-arrow-right text-gray-600 px-1 text-xs"></i> {{ value.oneStack.price }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePoeninja, displayRounding } from '@/web/background/Prices'
import { getDetailsId } from '../trends/getDetailsId'
import { ParsedItem } from '@/parser'
import { ItemFilters } from '../filters/interfaces'

export default defineComponent({
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const { findPriceByQuery, autoCurrency } = usePoeninja()

    function getPriceFor (n: number) {
      const one = findPriceByQuery(getDetailsId(props.item)!)!

      const price = (props.item.info.refName === 'Divine Orb')
        ? { min: n * one.chaos, max: n * one.chaos, currency: 'chaos' as const }
        : autoCurrency(n * one.chaos)

      return `${displayRounding(price.min)} ${price.currency}`
    }

    const { t } = useI18n()

    return {
      t,
      show: computed(() => {
        const id = getDetailsId(props.item)
        return Boolean(props.filters.stackSize && id && findPriceByQuery(id))
      }),
      value: computed(() => {
        return {
          have: {
            amount: props.filters.stackSize!.value,
            price: getPriceFor(props.filters.stackSize!.value)
          },
          oneStack: props.item.stackSize ? {
            amount: props.item.stackSize.max,
            price: getPriceFor(props.item.stackSize.max)
          } : null
        }
      })
    }
  }
})
</script>
