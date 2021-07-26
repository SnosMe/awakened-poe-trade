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
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ price(item).val }} {{ price(item).curr === 'e' ? 'exa' : 'chaos' }}</span>
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
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ price(item).val }} {{ price(item).curr === 'e' ? 'exa' : 'chaos' }}</span>
        </div>
        <div class="text-left text-gray-600 mb-1 whitespace-no-wrap overflow-hidden">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { ITEM_DROP } from '@/assets/data'
import { displayRounding, ItemInfo, findByDetailsId, autoCurrency } from '../../background/Prices'
import { getDetailsId } from '../trends/getDetailsId'
import { ParsedItem } from '@/parser'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      default: null
    }
  },
  setup (props) {
    const detailsId = computed(() => {
      if (props.item) {
        return getDetailsId(props.item)
      }
    })

    const result = computed(() => {
      if (!detailsId.value) return

      if (!ITEM_DROP.has(detailsId.value)) return null

      const r = ITEM_DROP.get(detailsId.value)!
      return {
        // TODO: show at least icon when price is not available on poe.ninja yet
        related: r.query.map(id => findByDetailsId(id)).filter(_ => Boolean(_)),
        items: r.items.map(id => findByDetailsId(id)).filter(_ => Boolean(_))
      }
    })

    return {
      result,
      detailsId,
      price (item: ItemInfo) {
        const _ = autoCurrency(item.receive.chaosValue, 'c')
        return {
          val: displayRounding(_.val, true),
          curr: _.curr
        }
      }
    }
  }
})
</script>
