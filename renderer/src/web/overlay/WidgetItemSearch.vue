<template>
  <widget :config="config" :move-handles="['tl', 'bl']" :removable="false" :inline-edit="false">
    <div class="widget-default-style flex flex-col p-1 gap-1" style="min-width: 24rem;">
      <transition-group v-if="starred.length" tag="div"
        :enter-active-class="$style.starredItemEnter"
        class="flex gap-x-1 py-1 pr-1 bg-gray-800 rounded">
        <div v-for="item in starred" :key="item.name + item.discr"
          :class="$style.starredItem">
          <item-quick-price
            :item-img="item.icon"
            :price="item.price"
            currency-text
          ></item-quick-price>
          <div class="ml-1 truncate" style="max-width: 7rem;">{{ item.name }}</div>
          <div v-if="item.discr"
            class="ml-1 truncate" style="max-width: 7rem;">{{ t(item.discr) }}</div>
        </div>
      </transition-group>
      <ui-timeout v-if="!showSearch"
        ref="showTimeout"
        @timeout="makeInvisible"
        class="self-center" :ms="4000" />
      <div v-else class="bg-gray-800 rounded">
        <div class="flex gap-x-1 p-1">
          <input type="text" :placeholder="t('Search by name…')" class="rounded bg-gray-900 px-1 flex-1"
            v-model="searchValue">
          <button @click="clearItems" class="btn"><i class="fas fa-times" /> {{ t('Reset items') }}</button>
        </div>
        <div class="flex gap-x-2 px-2 mb-px1 py-1">
          <span>{{ t('Heist target:') }}</span>
          <div class="flex gap-x-1">
            <button :class="{ 'border': (typeFilter === 'gem') }" class="rounded px-2 bg-gray-900"
              @click="typeFilter = 'gem'">{{ t('Skill Gem') }}</button>
            <button :class="{ 'border': (typeFilter === 'replica') }" class="rounded px-2 bg-gray-900"
              @click="typeFilter = 'replica'">{{ t('Replicas') }}, <span class="line-through text-gray-600">Base items</span></button>
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
                  <button v-for="altQuality in item.gem.altQuality" :key="altQuality"
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
            class="text-center p-8 max-w-xs"><i class="fas fa-search" /> {{ t('too_many') }}</div>
          <div v-else-if="!results.length"
            class="text-center p-8 max-w-xs"><i class="fas fa-exclamation-triangle" /> {{ t('not_found') }}</div>
        </div>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, shallowRef, ref, computed, nextTick, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { distance } from 'fastest-levenshtein'
import { ItemSearchWidget, WidgetManager } from './interfaces'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import Widget from './Widget.vue'
import { BaseType, ITEMS_ITERATOR, CLIENT_STRINGS as _$, ALTQ_GEM_NAMES, ITEM_BY_TRANSLATED } from '@/assets/data'
import { AppConfig } from '@/web/Config'
import { usePoeninja, CurrencyValue } from '@/web/background/Prices'
import { Host } from '@/web/background/IPC'

interface SelectedItem {
  name: string
  icon: string
  discr?: string
  chaos?: number
  price?: CurrencyValue
}

function useSelectedItems () {
  const items = ref<SelectedItem[]>([])

  function addItem (newItem: SelectedItem) {
    if (items.value.some(item =>
      item.name === newItem.name &&
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
  jsonIncludes: string[]
  matchFn: (item: BaseType) => boolean
}): BaseType[] | false {
  const search = opts.search.trim()
  const lcSearch = search.toLowerCase().split(/\s+/).sort((a, b) => b.length - a.length)
  if (search.length < 3) return false

  const out = []

  const lcLongestWord = lcSearch[0]
  const jsonSearch = (AppConfig().language !== 'cmn-Hant')
    ? lcLongestWord.slice(1) // in non-CJK first letter should be in first utf16 code unit
    : lcLongestWord

  const MAX_HITS = 70 // NOTE: based on first word only, so don't be too strict
  const MAX_RESULTS_VISIBLE = 5 // NOTE: don't want to pick from too many results
  const MAX_RESULTS = 10
  let hits = 0
  for (const match of ITEMS_ITERATOR(jsonSearch, opts.jsonIncludes)) {
    hits += 1
    const lcName = match.name.toLowerCase()
    if (
      opts.matchFn(match) &&
      lcSearch.every(part => lcName.includes(part)) &&
      ((AppConfig().language === 'cmn-Hant') || lcName.split(/\s+/).some(part => part.startsWith(lcLongestWord)))
    ) {
      out.push(match)
      if (out.length > MAX_RESULTS) return false
    }
    if (hits >= MAX_HITS) return false
  }
  return out.slice(0, MAX_RESULTS_VISIBLE)
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

export default defineComponent({
  components: { Widget, ItemQuickPrice },
  props: {
    config: {
      type: Object as PropType<ItemSearchWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()
    const { findPriceByQuery, autoCurrency } = usePoeninja()

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
        name: item.name,
        icon: item.icon,
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

    return {
      t,
      searchValue,
      typeFilter,
      results: computed(() => {
        if (typeFilter.value === 'gem') {
          return findItems({
            search: searchValue.value,
            jsonIncludes: ['GEM'],
            matchFn: (item) => Boolean(
              item.namespace === 'GEM' &&
              item.gem!.altQuality?.length)
          })
        } else {
          return findItems({
            search: searchValue.value,
            jsonIncludes: ['UNIQUE', 'Replica '],
            matchFn: (item) => Boolean(
              item.namespace === 'UNIQUE' &&
              item.refName.startsWith('Replica '))
          })
        }
      }),
      selectItem,
      clearItems () {
        clearItems()
        props.config.wmFlags = ['invisible-on-blur']
      },
      starred,
      showSearch: wm.active,
      showTimeout,
      makeInvisible () {
        props.config.wmFlags = ['invisible-on-blur']
      }
    }
  }
})
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
  @apply rounded px-1;
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

<i18n>
{
  "en": {
    "too_many": "Too many items found, enter the name more precisely.",
    "not_found": "No items found."
  },
  "ru": {
    "Search by name…": "Искать по имени…",
    "Reset items": "Сбросить предметы",
    "Heist target:": "Цель Кражи:",
    "Skill Gem": "Камни умений",
    "too_many": "Найдено слишком много предметов, уточните название.",
    "not_found": "Не найдено ни одного предмета.",
    "Replicas": "Копии"
  }
}
</i18n>
