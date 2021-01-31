<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto;">
    <!-- @TODO: fix "Matched" text jumping (min-height: 22px) -->
    <div class="mb-2 flex pl-2 justify-between items-baseline" style="min-height: 1.375rem;">
      <div class="flex items-center text-gray-500">
        <span class="mr-1">{{ t('Matched:') }}</span>
        <span v-if="!result" class="text-gray-600">...</span>
        <div v-else class="flex items-center">
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'chaos' ? 'transparent' : undefined }"
            @click="selectedCurr = 'chaos'">
            <img src="@/assets/images/chaos.png" class="trade-bulk-currency-icon">
            <span>{{ result.chaos.total }}</span>
          </button>
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'exa' ? 'transparent' : undefined }"
            @click="selectedCurr = 'exa'">
            <img src="@/assets/images/exa.png" class="trade-bulk-currency-icon">
            <span>{{ result.exa.total }}</span>
          </button>
          <span class="ml-1">[{{ t('Online') }}]</span>
        </div>
      </div>
      <div v-if="result" class="flex">
        <button @click="openTradeLink(false)" class="bg-gray-700 text-gray-400 rounded-l mr-px px-2">{{ t('Trade') }}</button>
        <button @click="openTradeLink(true)" class="bg-gray-700 text-gray-400 rounded-r px-2"><i class="fas fa-external-link-alt text-xs"></i></button>
      </div>
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ t('Price') }}</div>
            </th>
            <th class="trade-table-heading">
              <div class="pl-1 pr-2 flex text-xs" style="line-height: 1.3125rem;"><span class="w-8 inline-block text-right -ml-px mr-px">{{ selectedCurr }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ t('bulk') }}</span></div>
            </th>
            <th class="trade-table-heading">
              <div class="px-1">{{ t('Stock') }}</div>
            </th>
            <th class="trade-table-heading">
              <div class="px-1">{{ t('Fulfill') }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !config.showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ t('Listed') }}</span>
              </div>
            </th>
            <th v-if="config.showSeller" class="trade-table-heading w-full">
              <div class="px-2">{{ t('Seller') }}</div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll;">
          <template v-for="(result, idx) in selectedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <tr v-else :key="result.id">
              <td class="px-2">{{ Number((result.exchangeAmount / result.itemAmount).toFixed(4)) }}</td>
              <td class="pl-1 whitespace-no-wrap"><span class="w-8 inline-block text-right">{{ result.exchangeAmount }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ result.itemAmount }}</span></td>
              <td class="px-1 text-right">{{ result.stock }}</td>
              <td class="px-1 text-right"><i v-if="result.stock < result.itemAmount" class="fas fa-exclamation-triangle mr-1 text-gray-500"></i>{{ Math.floor(result.stock / result.itemAmount) }}</td>
              <td class="pr-2 pl-4 whitespace-no-wrap">
                <div class="inline-flex items-center">
                  <div class="account-status" :class="result.accountStatus"></div>
                  <div class="ml-1 font-sans text-xs">{{ getRelativeTime(result.listedAt) }}</div>
                </div>
                <span v-if="!config.showSeller && (config.accountName === result.accountName)" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
              </td>
              <td v-if="config.showSeller" class="px-2 whitespace-no-wrap">
                <span v-if="config.accountName === result.accountName" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
                <span v-else class="font-sans text-xs">{{ config.showSeller === 'ign' ? result.ign : result.accountName }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>
    <div>
      <span class="text-red-400">{{ t('Trade site request failed') }}</span>
      <button class="btn ml-2" @click="execSearch">{{ t('Retry') }}</button>
    </div>
    <div>Error: {{ error }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, ref, computed, watch, ComputedRef, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { MainProcess } from '@/ipc/main-process-bindings'
import { BulkSearch, execBulkSearch, PricingResult, requestResults } from './pathofexile-bulk'
import { tradeTag, getTradeEndpoint } from './common'
import { TRADE_TAG_BY_NAME } from '@/assets/data'
import { selected as league } from '../../background/Leagues'
import { Config } from '@/web/Config'
import { ItemFilters } from '../filters/interfaces'
import { ParsedItem } from '@/parser'
import { PriceCheckWidget, WidgetManager } from '@/web/overlay/interfaces'
import { artificialSlowdown } from './artificial-slowdown'

const slowdown = artificialSlowdown(900)

function useBulkApi () {
  type BulkSearchExtended = BulkSearch & {
    exa: { listed: ComputedRef<PricingResult[]> }
    chaos: { listed: ComputedRef<PricingResult[]> }
  }

  let searchId = 0
  const error = ref<string | null>(null)
  const result = shallowRef<BulkSearchExtended | null>(null)

  async function search (item: ParsedItem, filters: ItemFilters) {
    try {
      searchId += 1
      error.value = null
      result.value = null

      const _searchId = searchId
      const _result = await execBulkSearch(item, filters)
      if (_searchId === searchId) {
        result.value = {
          exa: {
            ..._result.exa,
            listed: getResultsByQuery(_result.exa)
          },
          chaos: {
            ..._result.chaos,
            listed: getResultsByQuery(_result.chaos)
          }
        }
      }
    } catch (err) {
      error.value = err.message
    }
  }

  function getResultsByQuery (query: BulkSearch['exa' | 'chaos']) {
    const items = shallowRef<PricingResult[]>([])
    let requested = false

    return computed(() => {
      if (query.total && !requested) {
        ;(async function () {
          try {
            requested = true
            items.value = await requestResults(query.queryId, query.listedIds.slice(0, 20))
          } catch (err) {
            error.value = err.message
          }
        })()
      }

      return items.value
    })
  }

  return { error, result, search }
}

export default defineComponent({
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
    const wm = inject<WidgetManager>('wm')!
    const widget = inject<{ config: ComputedRef<PriceCheckWidget> }>('widget')!
    const { error, result, search } = useBulkApi()

    const selectedCurr = ref<'chaos' | 'exa'>('chaos')

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const selectedResults = computed(() => {
      const arr = Array(20)
      if (!slowdown.isReady.value || !result.value) return arr

      const listed = result.value[selectedCurr.value].listed.value
      arr.splice(0, listed.length, ...listed)
      return arr
    })

    watch(result, () => {
      if (result.value) {
        const { exa, chaos } = result.value
        selectedCurr.value = (exa.total > chaos.total) ? 'exa' : 'chaos'
        // override, because at league start many players set wrong price, and this breaks auto-detection
        if (tradeTag(props.item) === TRADE_TAG_BY_NAME.get('Chaos Orb')) {
          selectedCurr.value = 'exa'
        } else if (tradeTag(props.item) === TRADE_TAG_BY_NAME.get('Exalted Orb')) {
          selectedCurr.value = 'chaos'
        }
      }
    })

    const { t } = useI18n()

    return {
      t,
      error,
      result,
      selectedResults,
      selectedCurr,
      execSearch: () => { search(props.item, props.filters) },
      config: computed(() => Config.store),
      openTradeLink (isExternal: boolean) {
        const link = `https://${getTradeEndpoint()}/trade/exchange/${league.value}/${result.value![selectedCurr.value].queryId}`
        if (isExternal) {
          MainProcess.openSystemBrowser(link)
        } else {
          wm.showBrowser(widget.config.value.wmId, link)
        }
      },
      getRelativeTime (iso: string) {
        return DateTime.fromISO(iso).toRelative({ style: 'short' })
      }
    }
  }
})
</script>

<style lang="postcss">
.trade-bulk-currency-icon {
  width: 1.75rem;
  height: 1.75rem;
  margin: -0.4375rem;
  margin-right: 0.125rem;
  filter: grayscale(1);
}
</style>

<i18n>
{
  "ru": {
    "Matched:": "Найдено:",
    "Trade": "Трейд",
    "Price": "Цена",
    "bulk": "опт",
    "Stock": "Запас",
    "Fulfill": "Сделки",
    "Listed": "Выставлен",
    "Seller": "Продавец",
    "Trade site request failed": "Запрос к сайту не удался"
  }
}
</i18n>
