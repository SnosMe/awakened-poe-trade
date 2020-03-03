<template>
  <ui-popper v-if="result" tag-name="div" class="flex" :delayOnMouseOut="150">
    <template slot="reference">
      <button class="text-gray-500 py-2 px-4 flex items-baseline"><i class="fas fa-chevron-circle-down"></i></button>
    </template>
    <div class="popper text-sm font-fontin-small-caps">
      <div class="flex bg-gray-800 text-gray-400 w-full">
        <div class="flex-1 p-2">
          <div v-for="item in result.related" :key="item.detailsId"
            :class="{ 'bg-gray-700 -mx-1 px-1': item.detailsId === detailsId }" class="rounded">
            <div class="flex items-center flex-1">
              <div class="w-8 h-8 flex items-center justify-center">
                <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
              </div>
              <i class="fas fa-arrow-right text-gray-600 px-2"></i>
              <span class="px-1 text-base whitespace-no-wrap">{{ price(item).val | displayRounding(true) }} {{ icon[price(item).curr].text }}</span>
            </div>
            <div class="text-left text-gray-600 truncate mb-1">{{ item.name }}</div>
          </div>
        </div>
        <div class="flex-1 p-2" v-if="result.items.length">
          <div v-for="item in result.items" :key="item.detailsId">
            <div class="flex items-center flex-1">
              <div class="w-8 h-8 flex items-center justify-center">
                <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
              </div>
              <i class="fas fa-arrow-right text-gray-600 px-2"></i>
              <span class="px-1 text-base whitespace-no-wrap">{{ price(item).val | displayRounding(true) }} {{ icon[price(item).curr].text }}</span>
            </div>
            <div class="text-left text-gray-600 truncate mb-1">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </ui-popper>
</template>

<script>
import { ITEM_DROP } from '@/data'
import { Prices, displayRounding } from '../Prices'

export default {
  props: {
    detailsId: {
      type: String,
      required: true
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
    result () {
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
