<template>
  <div v-if="show" class="p-4 layout-column min-h-0">
    <filter-name
      ref="nameFilter"
      :filters="itemFilters"
      :item="item" />
    <price-prediction v-if="showPredictedPrice" class="mb-4"
      :item="item" />
    <price-trend
      :item="item"
      :filters="itemFilters"
      @filter-item-base="applyItemBaseFilter" />
    <filters-block
      ref="filtersBlock"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item"
      @submit="interactedOnce = true" />
    <trade-listing
      v-if="tradeAPI === 'trade' && interactedOnce"
      ref="tradeService"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item" />
    <trade-bulk
      v-if="tradeAPI === 'bulk' && interactedOnce"
      ref="tradeService"
      :filters="itemFilters"
      :item="item" />
    <div v-if="!interactedOnce" @mouseenter="handleSearchMouseenter">
      <button class="btn" @click="interactedOnce = true">{{ t('Search') }}</button>
    </div>
    <stack-value :filters="itemFilters" :item="item"/>
    <div v-if="showSupportLinks" class="mt-auto border border-dashed p-2">
      <div class="mb-1">{{ t('Support development on') }} <img @click="openLink('https://patreon.com/awakened_poe_trade')" class="inline h-5 cursor-pointer animate__animated animate__fadeInRight" src="@/assets/images/Patreon.svg"></div>
      <i18n-t keypath="This tool relies on {0} and {1}, consider support them as well" tag="div">
        <span @click="openLink('https://poeprices.info')" class="bg-gray-900 px-1 rounded cursor-pointer">poeprices.info</span>
        <span @click="openLink('https://poe.ninja/support')" class="bg-gray-900 px-1 rounded cursor-pointer">poe.ninja</span>
      </i18n-t>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref, nextTick, computed, Ref, ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ItemCategory, ParsedItem } from '@/parser'
import TradeListing from './trade/TradeListing.vue'
import TradeBulk from './trade/TradeBulk.vue'
import { apiToSatisfySearch } from './trade/common'
import PriceTrend from './trends/PriceTrend.vue'
import FiltersBlock from './filters/FiltersBlock.vue'
import { createFilters } from './filters/create-item-filters'
import { initUiModFilters } from './filters/create-stat-filters'
import PricePrediction from './price-prediction/PricePrediction.vue'
import StackValue from './stack-value/StackValue.vue'
import FilterName from './filters/FilterName.vue'
import { CATEGORY_TO_TRADE_ID } from './trade/pathofexile-trade'
import { Config } from '@/web/Config'
import { ItemFilters, StatFilter } from './filters/interfaces'
import { ModifierType } from '@/parser/modifiers'
import { MainProcess } from '@/ipc/main-process-bindings'
import { PriceCheckWidget } from '../overlay/interfaces'

let _showSupportLinksCounter = 0

export default defineComponent({
  name: 'CheckedItem',
  components: {
    PricePrediction,
    TradeListing,
    TradeBulk,
    PriceTrend,
    FiltersBlock,
    FilterName,
    StackValue
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    },
    advancedCheck: {
      type: Boolean,
      required: true
    }
  },
  setup (props) {
    const widgetCfg = computed(() => {
      return Config.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget
    })

    const itemFilters = ref<ItemFilters>(null!)
    const itemStats = ref<StatFilter[]>(null!)
    const interactedOnce = ref(false)
    const tradeAPI = ref<'trade' | 'bulk'>('bulk')

    // TradeListing.vue OR TradeBulk.vue
    const tradeService = ref<{ execSearch(): void } | null>(null)
    // FilterName.vue
    const nameFilter = ref<{ toggleAccuracy(): void }>(null!)
    // FiltersBlock.vue
    const filtersBlock = ref<ComponentPublicInstance<{}, { showHidden: Ref<boolean> }>>(null!)

    watch(() => props.item, (item) => {
      itemFilters.value = createFilters(item)
      itemStats.value = initUiModFilters(item)

      if ((!props.advancedCheck && !widgetCfg.value.smartInitialSearch) ||
          (props.advancedCheck && !widgetCfg.value.lockedInitialSearch)) {
        interactedOnce.value = false
      } else {
        interactedOnce.value = Boolean(
          (item.rarity === ItemRarity.Unique) ||
          (item.category === ItemCategory.Map) ||
          (!CATEGORY_TO_TRADE_ID.has(item.category!)) ||
          (item.isUnidentified) ||
          (item.extra.veiled)
        )
      }
    }, { immediate: true })

    watch(() => [props.item, interactedOnce.value], () => {
      if (interactedOnce.value === false) return

      tradeAPI.value = apiToSatisfySearch(props.item, itemStats.value, itemFilters.value)

      // NOTE: child `trade-xxx` component renders/receives props on nextTick
      nextTick(() => {
        if (tradeService.value) {
          tradeService.value.execSearch()
        }
      })
    }, { deep: false, immediate: true })

    watch(() => [props.item, interactedOnce.value, itemStats.value, itemFilters.value], (curr, prev) => {
      const cItem = curr[0]; const pItem = prev[0]
      const cIntaracted = curr[1]; const pIntaracted = prev[1]

      if (cItem === pItem && cIntaracted === true && pIntaracted === true) {
        // force user to press Search button on change
        interactedOnce.value = false
      }
    }, { deep: true })

    watch(() => [props.item, JSON.stringify(itemFilters.value.trade)], (curr, prev) => {
      const cItem = curr[0]; const pItem = prev[0]
      const cTrade = curr[1]; const pTrade = prev[1]

      if (cItem === pItem && cTrade !== pTrade) {
        nextTick(() => {
          interactedOnce.value = true
        })
      }
    }, { deep: false })

    const showPredictedPrice = computed(() => {
      if (Config.store.language !== 'en') return false

      return props.item.rarity === ItemRarity.Rare &&
        props.item.category !== ItemCategory.Map &&
        props.item.category !== ItemCategory.CapturedBeast &&
        props.item.category !== ItemCategory.HeistContract &&
        props.item.category !== ItemCategory.HeistBlueprint &&
        props.item.category !== ItemCategory.MavenInvitation &&
        !props.item.isUnidentified
    })

    const show = computed(() => {
      return !(props.item.rarity === ItemRarity.Unique &&
        props.item.isUnidentified &&
        props.item.baseType == null)
    })

    async function applyItemBaseFilter () {
      for (const stat of itemStats.value) {
        if (stat.type === ModifierType.Fractured && stat.hidden) {
          stat.disabled = false
          filtersBlock.value.showHidden = true
        } else {
          stat.disabled = true
        }
      }
      await nextTick()

      itemFilters.value.itemLevel!.disabled = false
      if (itemFilters.value.influences) {
        itemFilters.value.influences[0].disabled = false
      }
      nameFilter.value.toggleAccuracy()
    }

    function handleSearchMouseenter (e: MouseEvent) {
      if ((filtersBlock.value.$el as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
        interactedOnce.value = true

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
    }

    const showSupportLinks = ref(false)
    watch(() => [props.item, interactedOnce.value], ([cItem, cInteracted], [pItem]) => {
      if (_showSupportLinksCounter >= 13 && (!cInteracted || tradeAPI.value === 'bulk')) {
        showSupportLinks.value = true
        _showSupportLinksCounter = 0
      } else {
        showSupportLinks.value = false
        if (cItem !== pItem) {
          _showSupportLinksCounter += 1
        }
      }
    })

    function openLink (link: string) {
      MainProcess.openSystemBrowser(link)
    }

    const { t } = useI18n()

    return {
      t,
      itemFilters,
      itemStats,
      interactedOnce,
      tradeAPI,
      tradeService,
      nameFilter,
      filtersBlock,
      showPredictedPrice,
      show,
      applyItemBaseFilter,
      handleSearchMouseenter,
      openLink,
      showSupportLinks
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Support development on": "Поддержите разработку на",
    "This tool relies on {0} and {1}, consider support them as well": "Это приложение полагается на сайт {1}, можете поддержать и его"
  }
}
</i18n>
