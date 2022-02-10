<template>
  <div v-if="result" class="flex max-w-full bg-gray-800 text-gray-400 mt-6 border border-gray-900" style="border-width: 0.25rem;">
    <div v-if="'error' in result" class="p-2">
      {{ result.error }}
    </div>
    <div v-if="'related' in result" class="flex-1 p-2 w-1/2">
      <div v-for="item in result.related" :key="item.name"
        :class="{ 'bg-gray-700 -mx-1 px-1': item.highlight }" class="rounded">
        <div class="flex items-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
          </div>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ item.price }}</span>
        </div>
        <div class="text-left text-gray-600 mb-1 whitespace-no-wrap overflow-hidden">{{ item.name }}</div>
      </div>
    </div>
    <div v-if="'items' in result && result.items.length" class="flex-1 p-2 w-1/2">
      <div v-for="item in result.items" :key="item.name">
        <div class="flex items-center flex-1">
          <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img :src="item.icon" :alt="item.name" class="max-w-full max-h-full">
          </div>
          <i class="fas fa-arrow-right text-gray-600 px-2"></i>
          <span class="px-1 text-base whitespace-no-wrap overflow-hidden">{{ item.price }}</span>
        </div>
        <div class="text-left text-gray-600 mb-1 whitespace-no-wrap overflow-hidden">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { BaseType, ITEM_BY_REF, ITEM_DROP } from '@/assets/data'
import { displayRounding, findByDetailsId, autoCurrency } from '../../background/Prices'
import { getDetailsId } from '../trends/getDetailsId'
import { ParsedItem } from '@/parser'

function findItemByQueryId (queryId: string): BaseType | undefined {
  const [ns, encodedName] = queryId.split('::')
  const [name, uniqueBase] = encodedName.split(' // ')
  let found = ITEM_BY_REF(ns as unknown as BaseType['namespace'], name)
  if (found && ns === 'UNIQUE') {
    found = found.filter(unique => unique.unique!.base === uniqueBase)
  }
  // return any first item
  if (found && found.length) return found[0]
}

function findPriceByQueryId (queryId: string) {
  let price = '?'
  const priceEntry = findByDetailsId(queryId)
  if (priceEntry) {
    const _ = autoCurrency(priceEntry.chaosValue, 'c')
    price = `${displayRounding(_.val, true)} ${_.curr === 'e' ? 'exa' : 'chaos'}`
  }
  return price
}

function getItemPrices (queryId: string) {
  const dropEntry = ITEM_DROP.find(entry => entry.query.includes(queryId))
  if (!dropEntry) return null

  const out = {
    related: [] as Array<{ name: string, icon: string, price: string, highlight: boolean }>,
    items: [] as Array<{ name: string, icon: string, price: string }>
  }
  for (const itemId of dropEntry.query) {
    const dbItem = findItemByQueryId(itemId)
    if (!dbItem) return { error: `Can't find "${itemId}".` }

    out.related.push({
      icon: dbItem.icon,
      name: dbItem.name,
      price: findPriceByQueryId(itemId),
      highlight: (itemId === queryId)
    })
  }
  for (const itemId of dropEntry.items) {
    const dbItem = findItemByQueryId(itemId)
    if (!dbItem) return { error: `Can't find "${itemId}".` }

    out.items.push({
      icon: dbItem.icon,
      name: dbItem.name,
      price: findPriceByQueryId(itemId)
    })
  }

  return out
}

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem | null>,
      default: null
    }
  },
  setup (props) {
    const result = computed(() => {
      if (!props.item) return

      const queryId = getDetailsId(props.item)
      if (!queryId) return

      return getItemPrices(queryId)
    })

    return { result }
  }
})
</script>
