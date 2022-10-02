<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto;">
    <!-- @TODO: fix "Matched" text jumping (min-height: 22px) -->
    <div class="mb-2 flex pl-2 justify-between items-baseline" style="min-height: 1.375rem;">
      <div class="flex items-center text-gray-500">
        <span class="mr-1">{{ t('Matched:') }}</span>
        <span v-if="!result" class="text-gray-600">...</span>
        <div v-else class="flex items-center">
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'xchgChaos' ? 'transparent' : undefined }"
            @click="selectedCurr = 'xchgChaos'">
            <img src="/images/chaos.png" class="trade-bulk-currency-icon">
            <span>{{ result.xchgChaos.listed.value?.total ?? '?' }}</span>
          </button>
          <button class="btn flex items-center mr-1" :style="{ background: selectedCurr !== 'xchgStable' ? 'transparent' : undefined }"
            @click="selectedCurr = 'xchgStable'">
            <img src="/images/divine.png" class="trade-bulk-currency-icon">
            <span>{{ result.xchgStable.listed.value?.total ?? '?' }}</span>
          </button>
          <span class="ml-1"><online-filter :filters="filters" /></span>
        </div>
      </div>
      <trade-links v-if="result"
        :get-link="makeTradeLink" />
    </div>
    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ t('Price') }}</div>
            </th>
            <th class="trade-table-heading">
              <div class="pl-1 pr-2 flex text-xs" style="line-height: 1.3125rem;"><span class="w-8 inline-block text-right -ml-px mr-px">{{ (selectedCurr === 'xchgChaos') ? 'chaos' : 'div' }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ t('bulk') }}</span></div>
            </th>
            <th class="trade-table-heading">
              <div class="px-1">{{ t('Stock') }}</div>
            </th>
            <th class="trade-table-heading">
              <div class="px-1">{{ t('Fulfill') }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem;">{{ t('Listed') }}</span>
              </div>
            </th>
            <th v-if="showSeller" class="trade-table-heading w-full">
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
              <td class="pl-1 whitespace-nowrap"><span class="w-8 inline-block text-right">{{ result.exchangeAmount }}</span><span>{{ '\u2009' }}/{{ '\u2009' }}</span><span class="w-8 inline-block">{{ result.itemAmount }}</span></td>
              <td class="px-1 text-right">{{ result.stock }}</td>
              <td class="px-1 text-right"><i v-if="result.stock < result.itemAmount" class="fas fa-exclamation-triangle mr-1 text-gray-500"></i>{{ Math.floor(result.stock / result.itemAmount) }}</td>
              <td class="pr-2 pl-4 whitespace-nowrap">
                <div class="inline-flex items-center">
                  <div class="account-status" :class="result.accountStatus"></div>
                  <div class="ml-1 font-sans text-xs">{{ result.relativeDate }}</div>
                </div>
                <span v-if="!showSeller && result.isMine" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
              </td>
              <td v-if="showSeller" class="px-2 whitespace-nowrap">
                <span v-if="result.isMine" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
                <span v-else class="font-sans text-xs">{{ showSeller === 'ign' ? result.ign : result.accountName }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <ui-error-box class="mb-4" v-else>
    <template #name>{{ t('Trade site request failed') }}</template>
    <p>Error: {{ error }}</p>
    <template #actions>
      <button class="btn" @click="execSearch">{{ t('Retry') }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch, ComputedRef, Ref, shallowRef, shallowReactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { BulkSearch, execBulkSearch, PricingResult } from './pathofexile-bulk'
import { getTradeEndpoint } from './common'
import { selected as league } from '../../background/Leagues'
import { AppConfig } from '@/web/Config'
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
    listedLazy: ComputedRef<PricingResult[]>
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

export default defineComponent({
  components: { OnlineFilter, TradeLinks },
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

    const selectedCurr = shallowRef<'xchgChaos' | 'xchgStable'>('xchgChaos')

    watch(() => props.item, (item) => {
      slowdown.reset(item)
    }, { immediate: true })

    const selectedResults = computed(() => {
      const arr = Array(20)
      if (!slowdown.isReady.value || !result.value) return arr

      const listed = result.value[selectedCurr.value].listedLazy.value
      arr.splice(0, listed.length, ...listed)
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

    const { t } = useI18n()

    return {
      t,
      error,
      result,
      selectedResults,
      selectedCurr,
      execSearch: () => { search(props.item, props.filters) },
      showSeller: computed(() => widget.value.showSeller),
      makeTradeLink () {
        return `https://${getTradeEndpoint()}/trade/exchange/${league.value}/${result.value![selectedCurr.value].listed.value!.queryId}`
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
  },
  "zh_CN": {
    "Matched:": "已匹配:",
    "Trade": "交易",
    "Price": "价格",
    "bulk": "批量",
    "Stock": "存量",
    "Fulfill": "完成",
    "Listed": "已列出",
    "Seller": "卖家",
    "Trade site request failed": "交易站点请求失败"
  },
  "cmn-Hant": {
    "Matched:": "已匹配:",
    "Trade": "交易",
    "Price": "價格",
    "bulk": "批量",
    "Stock": "存量",
    "Fulfill": "完成",
    "Listed": "已列出",
    "Seller": "賣家",
    "Trade site request failed": "交易站點請求失敗"
  }
}
</i18n>
