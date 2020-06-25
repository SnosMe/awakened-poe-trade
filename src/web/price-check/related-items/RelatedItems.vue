<template>
  <div v-if="result" class="flex max-w-full bg-gray-800 text-gray-400 mt-6 border border-gray-900" style="border-width: 0.25rem;">
    <div class="flex-1 p-2 w-1/2">
      <div v-for="item in result.related" :key="item.detailsId"
        :class="{ 'bg-gray-700 -mx-1 px-1': item.detailsId === detailsId }" class="rounded">
        <div class="flex items-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
          </div>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ price(item).val | displayRounding(true) }} {{ icon[price(item).curr].text }}</span>
        </div>
        <div class="text-left text-gray-600 mb-1 whitespace-no-wrap overflow-hidden">{{ item.name }}</div>
      </div>
    </div>
    <div class="flex-1 p-2 w-1/2" v-if="result.items.length">
      <div v-for="item in result.items" :key="item.detailsId">
        <div class="flex items-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
          </div>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ price(item).val | displayRounding(true) }} {{ icon[price(item).curr].text }}</span>
        </div>
        <div class="text-left text-gray-600 mb-1 whitespace-no-wrap overflow-hidden">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ITEM_DROP } from '@/assets/data'
import { Prices, displayRounding } from '../Prices'
import { getDetailsId } from '../trends/getDetailsId'

export default {
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  filters: { displayRounding },
  computed: {
    icon () {
      return {
        e: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?scale=1&w=1&h=1',
          text: 'exa'
        },
        c: {
          url: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?scale=1&w=1&h=1',
          text: 'chaos'
        }
      }
    },
    detailsId () {
      if (!this.item) return

      return getDetailsId(this.item)
    },
    result () {
      if (!this.detailsId) return

      if (!ITEM_DROP.has(this.detailsId)) return null

      const r = ITEM_DROP.get(this.detailsId)
      return {
        related: r.query.map(id => Prices.findByDetailsId(id)),
        items: r.items.map(id => Prices.findByDetailsId(id))
      }
    }
  },
  methods: {
    price (item) {
      return Prices.autoCurrency(item.receive.chaosValue, 'c')
    }
  }
}
</script>
