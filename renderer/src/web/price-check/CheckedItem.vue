<template>
  <div v-if="show" class="p-4 layout-column min-h-0">
    <filter-name
      :filters="itemFilters"
      :item="item" />
    <div v-if="item.disenchantCandidates" class="grid" style="grid-template-columns: auto auto;">
      <div v-if="disenchantValue" class="flex" style="padding-left: 9px">
        <img class="w-5" style="float: left" src="data:image/png;base64,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" />
        <span style="padding-left: 2px;">{{ disenchantValue }}</span>
      </div>
    </div>
    <price-prediction v-if="showPredictedPrice" class="mb-4"
      :item="item" />
    <price-trend v-else
      :item="item"
      :filters="itemFilters" />
    <filters-block
      ref="filtersComponent"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item"
      :presets="presets"
      @preset="selectPreset"
      @submit="doSearch = true" />
    <trade-listing
      v-if="tradeAPI === 'trade' && doSearch"
      ref="tradeService"
      :filters="itemFilters"
      :stats="itemStats"
      :item="item" />
    <trade-bulk
      v-if="tradeAPI === 'bulk' && doSearch"
      ref="tradeService"
      :filters="itemFilters"
      :item="item" />
    <div v-if="!doSearch" class="flex justify-between items-center">
      <div class="flex w-40" @mouseenter="handleSearchMouseenter">
        <button class="btn" @click="doSearch = true" style="min-width: 5rem;">{{ t('Search') }}</button>
      </div>
      <trade-links v-if="tradeAPI === 'trade'"
        :get-link="makeTradeLink" />
    </div>
    <stack-value :filters="itemFilters" :item="item"/>
    <div v-if="showSupportLinks" class="mt-auto border border-dashed p-2">
      <div class="mb-1">{{ t('Support development on') }} <a href="https://patreon.com/awakened_poe_trade" class="inline-flex align-middle animate__animated animate__fadeInRight" target="_blank"><img class="inline h-5" src="/images/Patreon.svg"></a></div>
      <i18n-t keypath="app.thanks_3rd_party" tag="div">
        <a href="https://poeprices.info" target="_blank" class="bg-gray-900 px-1 rounded">poeprices.info</a>
        <a href="https://poe.ninja/support" target="_blank" class="bg-gray-900 px-1 rounded">poe.ninja</a>
      </i18n-t>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, ref, nextTick, computed, ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ItemCategory, ParsedItem } from '@/parser'
import TradeListing from './trade/TradeListing.vue'
import TradeBulk from './trade/TradeBulk.vue'
import TradeLinks from './trade/TradeLinks.vue'
import { apiToSatisfySearch, getTradeEndpoint } from './trade/common'
import PriceTrend from './trends/PriceTrend.vue'
import FiltersBlock from './filters/FiltersBlock.vue'
import { createPresets } from './filters/create-presets'
import PricePrediction from './price-prediction/PricePrediction.vue'
import StackValue from './stack-value/StackValue.vue'
import FilterName from './filters/FilterName.vue'
import { CATEGORY_TO_TRADE_ID, createTradeRequest } from './trade/pathofexile-trade'
import { AppConfig } from '@/web/Config'
import { FilterPreset } from './filters/interfaces'
import { PriceCheckWidget } from '../overlay/interfaces'
import { useLeagues } from '@/web/background/Leagues'

let _showSupportLinksCounter = 0

export default defineComponent({
  name: 'CheckedItem',
  components: {
    PricePrediction,
    TradeListing,
    TradeBulk,
    TradeLinks,
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
    const widget = computed(() => AppConfig<PriceCheckWidget>('price-check')!)
    const leagues = useLeagues()

    const presets = ref<{ active: string, presets: FilterPreset[] }>(null!)
    const itemFilters = computed(() => presets.value.presets.find(preset => preset.id === presets.value.active)!.filters)
    const itemStats = computed(() => presets.value.presets.find(preset => preset.id === presets.value.active)!.stats)
    const doSearch = ref(false)
    const tradeAPI = ref<'trade' | 'bulk'>('bulk')

    // TradeListing.vue OR TradeBulk.vue
    const tradeService = ref<{ execSearch(): void } | null>(null)
    // FiltersBlock.vue
    const filtersComponent = ref<ComponentPublicInstance>(null!)

    watch(() => props.item, (item, prevItem) => {
      const prevCurrency = (presets.value != null) ? itemFilters.value.trade.currency : undefined

      presets.value = createPresets(item, {
        league: leagues.selectedId.value!,
        collapseListings: widget.value.collapseListings,
        activateStockFilter: widget.value.activateStockFilter,
        searchStatRange: widget.value.searchStatRange,
        useEn: (AppConfig().language === 'cmn-Hant' && AppConfig().realm === 'pc-ggg'),
        currency: widget.value.rememberCurrency || (prevItem &&
          item.info.namespace === prevItem.info.namespace &&
          item.info.refName === prevItem.info.refName
        ) ? prevCurrency : undefined
      })

      if ((!props.advancedCheck && !widget.value.smartInitialSearch) ||
          (props.advancedCheck && !widget.value.lockedInitialSearch)) {
        doSearch.value = false
      } else {
        doSearch.value = Boolean(
          (item.rarity === ItemRarity.Unique) ||
          (item.category === ItemCategory.Map) ||
          (item.category === ItemCategory.HeistBlueprint) ||
          (item.category === ItemCategory.SanctumRelic) ||
          (item.category === ItemCategory.Charm) ||
          (item.category === ItemCategory.Idol) ||
          (!CATEGORY_TO_TRADE_ID.has(item.category!)) ||
          (item.isUnidentified) ||
          (item.isVeiled)
        )
      }

      tradeAPI.value = apiToSatisfySearch(props.item, itemStats.value, itemFilters.value)
    }, { immediate: true })

    watch(() => [props.item, doSearch.value], () => {
      if (doSearch.value === false) return

      tradeAPI.value = apiToSatisfySearch(props.item, itemStats.value, itemFilters.value)

      // NOTE: child `trade-xxx` component renders/receives props on nextTick
      nextTick(() => {
        if (tradeService.value) {
          tradeService.value.execSearch()
        }
      })
    }, { deep: false, immediate: true })

    watch(() => [props.item, doSearch.value, itemStats.value, itemFilters.value], (curr, prev) => {
      const cItem = curr[0]; const pItem = prev[0]
      const cIntaracted = curr[1]; const pIntaracted = prev[1]

      if (cItem === pItem && cIntaracted === true && pIntaracted === true) {
        // force user to press Search button on change
        doSearch.value = false
      }
    }, { deep: true })

    watch(() => [props.item, JSON.stringify(itemFilters.value.trade)], (curr, prev) => {
      const cItem = curr[0]; const pItem = prev[0]
      const cTrade = curr[1]; const pTrade = prev[1]

      if (cItem === pItem && cTrade !== pTrade) {
        nextTick(() => {
          doSearch.value = true
        })
      }
    }, { deep: false })

    const showPredictedPrice = computed(() => {
      if (!widget.value.requestPricePrediction ||
          AppConfig().language !== 'en' ||
          !leagues.selected.value!.isPopular) return false

      if (presets.value.active === 'filters.preset_base_item') return false

      return props.item.rarity === ItemRarity.Rare &&
        props.item.category !== ItemCategory.Map &&
        props.item.category !== ItemCategory.CapturedBeast &&
        props.item.category !== ItemCategory.HeistContract &&
        props.item.category !== ItemCategory.HeistBlueprint &&
        props.item.category !== ItemCategory.Invitation &&
        props.item.info.refName !== 'Expedition Logbook' &&
        !props.item.isUnidentified
    })

    const show = computed(() => {
      return !(props.item.rarity === ItemRarity.Unique &&
        props.item.isUnidentified &&
        props.item.info.unique == null)
    })

    function handleSearchMouseenter (e: MouseEvent) {
      if ((filtersComponent.value.$el as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
        doSearch.value = true

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
    }

    const showSupportLinks = ref(false)
    watch(() => [props.item, doSearch.value], ([cItem, cInteracted], [pItem]) => {
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

    const disenchantValue = computed(() => {
      for (const uniqueItemDisenchanting of props.item.disenchantCandidates) {
        if (uniqueItemDisenchanting.name == props.item.info.refName) {
          return uniqueItemDisenchanting.value
        }
      }
      return null
    })

    const { t } = useI18n()

    return {
      t,
      itemFilters,
      itemStats,
      doSearch,
      tradeAPI,
      tradeService,
      disenchantValue,
      filtersComponent,
      showPredictedPrice,
      show,
      handleSearchMouseenter,
      showSupportLinks,
      presets: computed(() => presets.value.presets.map(preset =>
        ({ id: preset.id, active: (preset.id === presets.value.active) }))),
      selectPreset (id: string) {
        presets.value.active = id
      },
      makeTradeLink () {
        return `https://${getTradeEndpoint()}/trade/search/${itemFilters.value.trade.league}?q=${JSON.stringify(createTradeRequest(itemFilters.value, itemStats.value, props.item))}`
      }
    }
  }
})
</script>
