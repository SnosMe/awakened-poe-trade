<template>
  <Widget :config="config" :move-handles="['tl', 'bl']" :removable="false" :inline-edit="false">
    <div class="widget-default-style flex flex-col p-1 gap-1" style="min-width: 24rem;">
      <transition-group v-if="starred.length" tag="div"
        :enter-active-class="$style.starredItemEnter"
        class="flex gap-x-1 bg-gray-800 rounded">
        <button v-for="item in starred" :key="item.info.refName + item.discr"
          :class="$style.starredItem"
          @click="starredItemClick($event, item)">
          <ItemQuickPrice
            :item-img="item.info.icon"
            :price="item.price"
            currency-text
          ></ItemQuickPrice>
          <div class="ml-1 truncate" style="max-width: 7rem;">{{ item.info.name }}</div>
          <div v-if="item.discr"
            class="ml-1 truncate" style="max-width: 7rem;">{{ t(item.discr) }}</div>
        </button>
      </transition-group>
      <UiTimeout v-if="!showSearch"
        ref="showTimeout"
        @timeout="makeInvisible"
        class="self-center" :ms="4000" />
      <div v-else class="bg-gray-800 rounded">
        <div class="flex gap-x-1 p-1">
          <input type="text" :placeholder="t(':input')" class="rounded bg-gray-900 px-1 flex-1"
            v-model="searchValue">
          <button @click="clearSelectedItems" class="btn"><i class="fas fa-times" /> {{ t(':reset') }}</button>
        </div>
        <div class="flex gap-x-2 px-2 mb-px1 py-1">
          <span>{{ t(':heist_target') }}</span>
          <div class="flex gap-x-1">
            <button :class="{ 'border': (typeFilter === 'gem') }" class="rounded px-2 bg-gray-900"
              @click="typeFilter = 'gem'">{{ t(':target_gem') }}</button>
            <button :class="{ 'border': (typeFilter === 'replica') }" class="rounded px-2 bg-gray-900"
              @click="typeFilter = 'replica'">{{ t(':target_replica') }}, <span class="line-through text-gray-600">Base items</span></button>
          </div>
        </div>
        <div class="flex flex-col">
          <div v-for="item in (results || [])" :key="item.name">
            <div class="flex" :class="$style.itemWrapper">
              <div class="w-8 h-8 flex items-center justify-center">
                <img :src="item.icon" class="max-w-full max-h-full overflow-hidden">
              </div>
              <div>
                <div class="h-8 flex items-center px-1">{{ item.name }}</div>
                <div v-if="item.gem" class="flex gap-x-1">
                  <button v-for="altQuality in []" :key="altQuality"
                    @click="selectItem(item, { altQuality })"
                    >{{ t(altQuality) }}</button>
                </div>
                <div v-else-if="item.unique" class="flex gap-x-1">
                  <button  @click="selectItem(item, { unique: true })"
                    >{{ t('Select') }}</button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="results === false"
            class="text-center p-8 max-w-xs"><i class="fas fa-search" /> {{ t(':too_many') }}</div>
          <div v-else-if="!results.length"
            class="text-center p-8 max-w-xs"><i class="fas fa-exclamation-triangle" /> {{ t(':not_found') }}</div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import { ref } from 'vue'
import { distance } from 'fastest-levenshtein'
import { BaseType, ITEM_BY_TRANSLATED, CLIENT_STRINGS as _$, ALTQ_GEM_NAMES, REPLICA_UNIQUE_NAMES } from '@/assets/data'
import { AppConfig } from '@/web/Config'
import { CurrencyValue } from '@/web/background/Prices'
import type { WidgetSpec } from '../overlay/interfaces'
import { ItemSearchWidget } from './widget.js'

export default {
  widget: {
    type: 'item-search',
    instances: 'single',
    initInstance: (): ItemSearchWidget => {
      return {
        wmId: 0,
        wmType: 'item-search',
        wmTitle: '{icon=fa-search}',
        wmWants: 'hide',
        wmZorder: null,
        wmFlags: ['invisible-on-blur'],
        anchor: {
          pos: 'tl',
          x: 10,
          y: 20
        },
        ocrGemsKey: null
      }
    }
  } satisfies WidgetSpec
}

interface SelectedItem {
  info: BaseType
  discr?: string
  chaos?: number
  price?: CurrencyValue
}

function useSelectedItems () {
  const items = ref<SelectedItem[]>([])

  function addItem (newItem: SelectedItem) {
    if (items.value.some(item =>
      item.info.name === newItem.info.name &&
      item.discr === newItem.discr
    )) return false

    if (items.value.length < 5) {
      items.value.push(newItem)
      items.value.sort((a, b) => {
        return (b.chaos ?? 0) - (a.chaos ?? 0)
      })
    } else {
      items.value = [newItem]
    }
    return true
  }

  function clearItems () {
    items.value = []
  }

  return { items, addItem, clearItems }
}

function findItems (opts: {
  search: string
  namespace: 'GEM' | 'UNIQUE'
  itemNames: () => Generator<string>
}): BaseType[] | false {
  const search = opts.search.trim()
  const lcSearch = search.toLowerCase().split(/\s+/).sort((a, b) => b.length - a.length)
  const lcLongestWord = lcSearch[0]
  if (search.length < 3) return false

  const MAX_RESULTS = 5 // NOTE: don't want to pick from too many results
  const out = []
  for (const itemName of opts.itemNames()) {
    const lcName = itemName.toLowerCase()
    if (
      lcSearch.every(part => lcName.includes(part)) &&
      ((AppConfig().language === 'cmn-Hant') || lcName.split(/\s+/).some(part => part.startsWith(lcLongestWord)))
    ) {
      const match = ITEM_BY_TRANSLATED(opts.namespace, itemName)
      out.push(...match ?? [])
      if (out.length > MAX_RESULTS) return false
    }
  }
  return out
}

function fuzzyFindHeistGem (badStr: string) {
  badStr = badStr.toLowerCase()

  const qualities = [
    ['Anomalous', _$.QUALITY_ANOMALOUS.toString().slice(2, -2)],
    ['Divergent', _$.QUALITY_DIVERGENT.toString().slice(2, -2)],
    ['Phantasmal', _$.QUALITY_PHANTASMAL.toString().slice(2, -2)]
  ]

  let bestMatch: { name: string, altQuality: string }
  let minDist = Infinity
  for (const name of ALTQ_GEM_NAMES()) {
    for (const [altQuality, reStr] of qualities) {
      const exactStr = reStr.replace('(.*)', name).toLowerCase()
      if (Math.abs(exactStr.length - badStr.length) > 5) {
        continue
      }

      const dist = distance(badStr, exactStr)
      if (dist < minDist) {
        bestMatch = { name, altQuality }
        if (dist === 0) return bestMatch
        minDist = dist
      }
    }
  }
  return bestMatch!
}
</script>

<script setup lang="ts">
import { shallowRef, computed, nextTick, inject } from 'vue'
import { useI18nNs } from '@/web/i18n'
import { WidgetManager } from '../overlay/interfaces'
import { usePoeninja } from '@/web/background/Prices'
import { Host } from '@/web/background/IPC'
import { createVirtualItem, ItemRarity } from '@/parser/ParsedItem'
import { ItemCategory } from '@/parser'

import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import Widget from '../overlay/Widget.vue'
import UiTimeout from '@/web/ui/UiTimeout.vue'

const props = defineProps<{
  config: ItemSearchWidget
}>()

const wm = inject<WidgetManager>('wm')!
const { t } = useI18nNs('item_search')
const { findPriceByQuery, autoCurrency, queuePricesFetch } = usePoeninja()

const showTimeout = shallowRef<{ reset:() => void } | null>(null)

nextTick(() => {
  props.config.wmFlags = ['invisible-on-blur']
})

const searchValue = shallowRef('')
const { items: starred, addItem, clearItems } = useSelectedItems()

const typeFilter = shallowRef<'gem' | 'replica'>('gem')

Host.onEvent('MAIN->CLIENT::ocr-text', (e) => {
  if (e.target !== 'heist-gems') return

  for (const para of e.paragraphs) {
    const res = fuzzyFindHeistGem(para)
    selectItem(
      ITEM_BY_TRANSLATED('GEM', res.name)![0],
      { altQuality: res.altQuality, withTimeout: true }
    )
  }
})

function selectItem (item: BaseType, opts: { altQuality?: string, unique?: true, withTimeout?: true }) {
  queuePricesFetch()

  let price: ReturnType<typeof findPriceByQuery>
  if (opts.altQuality) {
    price = findPriceByQuery({
      ns: item.namespace,
      name: `${opts.altQuality} ${item.refName}`,
      variant: '1'
    })
  } else {
    price = findPriceByQuery({
      ns: item.namespace,
      name: item.refName,
      variant: item.unique!.base
    })
  }
  const isAdded = addItem({
    info: item,
    discr: opts.altQuality,
    chaos: price?.chaos,
    price: (price != null) ? autoCurrency(price.chaos) : undefined
  })
  if (isAdded && opts.withTimeout) {
    showTimeout.value?.reset()
    props.config.wmFlags = []
  }
  searchValue.value = ''
}

const results = computed(() => {
  if (typeFilter.value === 'gem') {
    return findItems({
      search: searchValue.value,
      namespace: 'GEM',
      itemNames: ALTQ_GEM_NAMES
    })
  } else {
    return findItems({
      search: searchValue.value,
      namespace: 'UNIQUE',
      itemNames: REPLICA_UNIQUE_NAMES
    })
  }
})

function clearSelectedItems () {
  clearItems()
  props.config.wmFlags = ['invisible-on-blur']
}

const showSearch = wm.active

function makeInvisible () {
  props.config.wmFlags = ['invisible-on-blur']
}

function starredItemClick (e: MouseEvent, item: SelectedItem) {
  const parsed = (item.info.namespace === 'GEM')
    ? createVirtualItem({
      category: ItemCategory.Gem,
      info: item.info,
      gemLevel: 1
    })
    : createVirtualItem({
      rarity: ItemRarity.Unique,
      info: item.info
    })

  Host.selfDispatch({
    name: 'MAIN->CLIENT::item-text',
    payload: {
      clipboard: parsed.rawText,
      item: parsed,
      position: { x: e.clientX, y: e.clientY },
      focusOverlay: true,
      target: 'price-check'
    }
  })
}
</script>

<style lang="postcss" module>
.itemWrapper {
  @apply pl-1 pt-1;
  overflow: hidden;

  &:hover {
    background: linear-gradient(to left, theme('colors.gray.800'), theme('colors.gray.900'));
  }

  button {
    @apply text-gray-600;
    @apply px-1;
    @apply rounded;
  }

  &:hover button {
    @apply text-gray-400;
    @apply bg-gray-700;
  }
}

.starredItem {
  display: flex;
  flex-direction: column;
  @apply rounded px-1 pb-1 pt-0.5;

  &:hover {
    @apply bg-gray-700;
  }
}

@keyframes starredItemEnter {
  0% { @apply bg-transparent; }
  50% { @apply bg-gray-700; }
  100% { @apply bg-transparent; }
}
.starredItemEnter {
  animation: starredItemEnter 0.8s linear;
}
</style>
