<template>
  <div v-if="show"
    class="p-2 border-dashed border border-gray-600 rounded mt-2">
    <div class="flex text-gray-400 leading-none">
      <div class="w-1/2"
        >{{ $t('You have') }} <span class="font-sans">×</span> {{ value.have.amount }} <i class="fas fa-arrow-right text-gray-600 px-1 text-xs"></i> {{ value.have.price }}</div>
      <div class="w-1/2 pl-2" v-if="value.oneStack"
        >{{ $t('Stack') }} <span class="font-sans">×</span> {{ value.oneStack.amount }} <i class="fas fa-arrow-right text-gray-600 px-1 text-xs"></i> {{ value.oneStack.price }}</div>
    </div>
  </div>
</template>

<script>
import { Prices, displayRounding } from '../Prices'
import { getDetailsId } from '../trends/getDetailsId'

export default {
  props: {
    filters: {
      type: Object,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    show () {
      const id = getDetailsId(this.item)
      return Boolean(this.filters.stackSize && id && Prices.findByDetailsId(id))
    },
    value () {
      return {
        have: {
          amount: this.filters.stackSize.value,
          price: this.getPriceFor(this.filters.stackSize.value)
        },
        oneStack: this.item.stackSize ? {
          amount: this.item.stackSize.max,
          price: this.getPriceFor(this.item.stackSize.max)
        } : null
      }
    }
  },
  methods: {
    getPriceFor (n) {
      const one = Prices.findByDetailsId(getDetailsId(this.item))

      const price = (this.item.name === 'Exalted Orb')
        ? { val: n * one.receive.chaosValue, curr: 'c' }
        : Prices.autoCurrency(n * one.receive.chaosValue, 'c')

      return `${displayRounding(price.val, true)} ${price.curr === 'c' ? 'chaos' : 'exa'}`
    }
  }
}
</script>

<i18n>
{
  "ru": {
    "You have": "В наличии",
    "Stack": "Стак"
  }
}
</i18n>
