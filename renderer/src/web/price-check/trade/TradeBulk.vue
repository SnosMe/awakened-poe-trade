<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto;">
    <div :class="$style.legacyMessage">
      {{ t(':legacy_bulk_xchg_msg') }}
    </div>
    <!-- @TODO: fix "Matched" text jumping (min-height: 22px) -->
    <div class="mb-2 flex pl-2 justify-between items-baseline" style="min-height: 1.375rem;">
      <div class="flex items-center text-gray-500">
        <span class="mr-1">{{ t(':matched') }}</span>
        <span v-if="!result" class="text-gray-600">...</span>
        <div v-else class="flex items-center">
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'xchgChaos' ? 'transparent' : undefined }"
            @click="selectedCurr = 'xchgChaos'">
            <img src="/images/chaos.png" :class="$style.currencyIcon">
            <span>{{ result.xchgChaos.listed.value?.total ?? '?' }}</span>
          </button>
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'xchgStable' ? 'transparent' : undefined }"
            @click="selectedCurr = 'xchgStable'">
            <img src="/images/divine.png" :class="$style.currencyIcon">
            <span>{{ result.xchgStable.listed.value?.total ?? '?' }}</span>
          </button>
          <span class="ml-1"><online-filter :filters="filters" api="bulk" /></span>
        </div>
      </div>
      <trade-links v-if="result"
        :get-link="makeTradeLink" />
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th :class="$style.tableHeading">
              <div class="px-2">{{ t(':price') }}</div>
            </th>
            <th :class="$style.tableHeading">
              <div class="pl-1 pr-2 flex text-xs" style="line-height: 1.3125rem;"><span class="w-8 inline-block text-right -ml-px mr-px">{{ (selectedCurr === 'xchgChaos') ? 'chaos' : 'div' }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ t(':bulk') }}</span></div>
            </th>
            <th :class="$style.tableHeading">
              <div class="px-1">{{ t(':stock') }}</div>
            </th>
            <th :class="$style.tableHeading">
              <div class="px-1">{{ t(':fulfill') }}</div>
            </th>
            <th :class="[$style.tableHeading, { 'w-full': !showSeller }]">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ t(':listed') }}</span>
              </div>
            </th>
            <th v-if="showSeller" class="w-full" :class="$style.tableHeading">
              <div class="px-2">{{ t(':seller') }}</div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll;">
          <template v-for="(result, idx) in selectedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <tr v-else :key="result.id"
              :class="{ [$style.marketRatioRow]: ('marketRatio' in result) }">
              <td class="px-2">{{ Number((result.exchangeAmount / result.itemAmount).toFixed(4)) }}</td>
              <td class="pl-1 whitespace-nowrap"><span class="w-8 inline-block text-right">{{ Number(result.exchangeAmount.toFixed(1)) }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ Number(result.itemAmount.toFixed(1)) }}</span></td>
              <template v-if="'marketRatio' in result">
                <td class="pl-1 pr-2 whitespace-nowrap text-center" :colspan="showSeller ? 4 : 3">{{ t(':market_ratio') }}</td>
              </template>
              <template v-else>
                <td class="px-1 text-right">{{ result.stock }}</td>
                <td class="px-1 text-right"><i v-if="result.stock < result.itemAmount" class="fas fa-exclamation-triangle mr-1 text-gray-500"></i>{{ Math.floor(result.stock / result.itemAmount) }}</td>
                <td class="pr-2 pl-4 whitespace-nowrap">
                  <div class="inline-flex items-center">
                    <div :class="[$style.accountStatus, $style[result.accountStatus]]"></div>
                    <div class="ml-1 font-sans text-xs">{{ result.relativeDate }}</div>
                  </div>
                  <span v-if="!showSeller && result.isMine" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
                </td>
                <td v-if="showSeller" class="px-2 whitespace-nowrap">
                  <span v-if="result.isMine" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
                  <span v-else class="font-sans text-xs">{{ showSeller === 'ign' ? result.ign : result.accountName }}</span>
                </td>
              </template>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <ui-error-box class="mb-4" v-else>
    <template #name>{{ t(':error') }}</template>
    <p>Error: {{ error }}</p>
    <template #actions>
      <button class="btn" @click="execSearch">{{ t('Retry') }}</button>
      <button class="btn" @click="openTradeLink">{{ t('Browser') }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch, ComputedRef, Ref, shallowRef, shallowReactive, inject, readonly } from 'vue'
import { useI18nNs } from '@/web/i18n'
import UiErrorBox from '@/web/ui/UiErrorBox.vue'
import { BulkSearch, execBulkSearch, createTradeRequest, PricingResult } from './pathofexile-bulk'
import { getTradeEndpoint } from './common'
import { AppConfig } from '@/web/Config'
import { usePoeninja } from '@/web/background/Prices'
import { useLeagues } from '@/web/background/Leagues'
import { getDetailsId } from '../trends/getDetailsId'
import { ItemFilters } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { PriceCheckWidget } from '@/web/overlay/interfaces'
import { artificialSlowdown } from './artificial-slowdown'
import OnlineFilter from './OnlineFilter.vue'
import TradeLinks from './TradeLinks.vue'

const slowdown = artificialSlowdown(900)

function useBulkApi () {
  type BulkSearchExtended = Record<'xchgChaos' | 'xchgStable', {
    listed: Ref<BulkSearch | null>
    listedLazy: ComputedRef<readonly PricingResult[]>
  }>

  let searchId = 0
  const error = shallowRef<string | null>(null)
  const result = shallowRef<BulkSearchExtended | null>(null)

  async function search (item: ParsedItem, filters: ItemFilters) {
    try {
      searchId += 1
      error.value = null
      result.value = null

      const _searchId = searchId

      // override, because at league start many players set wrong price, and this breaks optimistic search
      const have = (item.info.refName === 'Chaos Orb')
        ? ['divine']
        : (item.info.refName === 'Divine Orb')
            ? ['chaos']
            : ['divine', 'chaos']

      const optimisticSearch = await execBulkSearch(
        item, filters, have, { accountName: AppConfig().accountName })
      if (_searchId === searchId) {
        result.value = {
          xchgStable: getResultsByHave(item, filters, optimisticSearch, 'divine'),
          xchgChaos: getResultsByHave(item, filters, optimisticSearch, 'chaos')
        }
      }
    } catch (err) {
      error.value = (err as Error).message
    }
  }

  function getResultsByHave (
    item: ParsedItem,
    filters: ItemFilters,
    preloaded: Array<BulkSearch | null>,
    have: 'divine' | 'chaos'
  ) {
    const _result = shallowRef(
      preloaded.some(res => res?.haveTag === have)
        ? shallowReactive(preloaded.find(res => res?.haveTag === have)!)
        : null)
    const items = shallowRef<PricingResult[]>(_result.value?.listed ?? [])
    let requested: boolean = (_result.value != null)

    const listedLazy = computed(() => {
      if (!requested) {
        ;(async function () {
          try {
            requested = true
            _result.value = shallowReactive((await execBulkSearch(
              item, filters, [have], { accountName: AppConfig().accountName }))[0]!
            )
            items.value = _result.value.listed
            const otherHave = (have === 'divine')
              ? result.value?.xchgChaos?.listed.value!
              : result.value?.xchgStable?.listed.value!
            // fix best guess we did while making optimistic search
            otherHave.total -= _result.value.total
          } catch (err) {
            error.value = (err as Error).message
          }
        })()
      }

      return items.value
    })

    return { listed: _result, listedLazy }
  }

  return { error, result, search }
}

interface MarketRatio extends Pick<PricingResult, 'exchangeAmount' | 'itemAmount'> {
  id: 'market-ratio'
  marketRatio: true
}

function mergeWithMarketRatio (results: readonly PricingResult[], marketRatio: MarketRatio): Array<PricingResult | MarketRatio> {
  if (!results.length) return [marketRatio]

  const out: Array<PricingResult | MarketRatio> = [...results]
  let insertIdx = results.findIndex(result =>
    (result.exchangeAmount / result.itemAmount) >= (marketRatio.exchangeAmount / marketRatio.itemAmount))
  if (insertIdx === -1) {
    insertIdx = results.length
  }
  out.splice(insertIdx, 0, marketRatio)
  return out
}

function useMarketRatioFinder () {
  type MarketRatioMap = Record<'xchgChaos' | 'xchgStable', MarketRatio | undefined>

  const { selected: defaultLeague } = useLeagues()
  const { findPriceByQuery, xchgRate } = usePoeninja()
  const marketRatio = shallowRef<MarketRatioMap>({ xchgChaos: undefined, xchgStable: undefined })

  function find (item: ParsedItem, filters: ItemFilters): void {
    marketRatio.value = { xchgChaos: undefined, xchgStable: undefined }

    if (filters.trade.league !== defaultLeague.value?.id) return

    const detailsId = getDetailsId(item)
    const priceEntry = detailsId && findPriceByQuery(detailsId)
    if (!priceEntry) return

    let xchgChaos: MarketRatio | undefined
    if (priceEntry.chaos < ((xchgRate.value || 9999) * 1.06)) {
      let price: number
      let items: number
      if (priceEntry.chaos > 4) {
        price = priceEntry.chaos
        items = 1
      } else {
        price = (priceEntry.chaos > 1) ? 20 : 10
        items = price / priceEntry.chaos
      }
      xchgChaos = { id: 'market-ratio', marketRatio: true, exchangeAmount: price, itemAmount: items }
    }

    let xchgStable: MarketRatio | undefined
    if (xchgRate.value !== undefined) {
      let price: number
      let items: number
      if (priceEntry.chaos > (xchgRate.value * 0.94)) {
        price = priceEntry.chaos / xchgRate.value
        items = 1
      } else {
        price = (priceEntry.chaos > (xchgRate.value * 0.2)) ? 2 : 1
        items = price * (xchgRate.value / priceEntry.chaos)
      }
      xchgStable = { id: 'market-ratio', marketRatio: true, exchangeAmount: price, itemAmount: items }
    }

    marketRatio.value = { xchgChaos, xchgStable }
  }

  return { marketRatio: readonly(marketRatio), find }
}

export default defineComponent({
  components: { OnlineFilter, TradeLinks, UiErrorBox },
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
    const widget = computed(() => AppConfig<PriceCheckWidget>('price-check')!)
    const { error, result, search } = useBulkApi()
    const { marketRatio, find: findMarketRatio } = useMarketRatioFinder()

    const showBrowser = inject<(url: string) => void>('builtin-browser')!

    const selectedCurr = shallowRef<'xchgChaos' | 'xchgStable'>('xchgChaos')

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const selectedResults = computed(() => {
      const arr = Array<PricingResult | MarketRatio | undefined>(20)
      if (!slowdown.isReady.value || !result.value) return arr

      const listed = result.value[selectedCurr.value].listedLazy.value
      const ratio = marketRatio.value[selectedCurr.value]
      const merged = (ratio !== undefined)
        ? mergeWithMarketRatio(listed.slice(0, 19), ratio)
        : listed
      arr.splice(0, merged.length, ...merged)
      return arr
    })

    watch(result, () => {
      const stableTotal = result.value?.xchgStable.listed.value?.total
      const chaosTotal = result.value?.xchgChaos.listed.value?.total
      if (stableTotal == null) {
        selectedCurr.value = 'xchgChaos'
      } else if (chaosTotal == null) {
        selectedCurr.value = 'xchgStable'
      } else {
        selectedCurr.value = (stableTotal > chaosTotal) ? 'xchgStable' : 'xchgChaos'
      }
    })

    function makeTradeLink (_have?: string[]) {
      const have = _have ?? ((selectedCurr.value === 'xchgStable') ? ['divine'] : ['chaos'])
      const httpPostBody = createTradeRequest(props.filters, props.item, have)
      const httpGetQuery = { exchange: httpPostBody.query }
      return `https://${getTradeEndpoint()}/trade/exchange/${props.filters.trade.league}?q=${JSON.stringify(httpGetQuery)}`
    }

    const { t } = useI18nNs('trade_result')

    return {
      t,
      error,
      result,
      selectedResults,
      selectedCurr,
      execSearch: () => {
        search(props.item, props.filters)
        findMarketRatio(props.item, props.filters)
      },
      showSeller: computed(() => widget.value.showSeller),
      makeTradeLink,
      openTradeLink () {
        showBrowser(makeTradeLink(['mirror']))
      }
    }
  }
})
</script>

<style lang="postcss" module>
.tableHeading {
  @apply sticky top-0;
  @apply bg-gray-800;
  @apply p-0 m-0;
  white-space: nowrap;

  & > div {
    @apply border-b border-gray-700;
  }
}

.accountStatus {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  /* &.online {} */
  &.offline { @apply bg-red-600; }
  &.afk { @apply bg-orange-500; }
}

.currencyIcon {
  width: 1.75rem;
  height: 1.75rem;
  margin: -0.4375rem;
  margin-right: 0.125rem;
  filter: grayscale(1);
}

.legacyMessage {
  @apply rounded p-2 mb-3;
  @apply border border-gray-600 bg-gray-700;
  text-wrap-style: balance;
  text-align: center;
}

.marketRatioRow {
  @apply bg-gray-700 !important;
  outline: 1px solid theme('colors.gray.600');
  outline-offset: -1px;
}
</style>
