<template #search>
  <div class="flex">
    <button @click="openTradeLink(false)" class="bg-gray-700 text-gray-400 rounded-l mr-px px-2 leading-none">{{ t('Trade') }}</button>
    <button @click="openTradeLink(true)" class="bg-gray-700 text-gray-400 rounded-r px-2 leading-none"><i class="fas fa-external-link-alt text-xs"></i></button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ParsedItem } from '@/parser'
import { ItemFilters, StatFilter } from '../filters/interfaces'
import { getTradeEndpoint } from './common'
import { createTradeRequest, SearchResult } from './pathofexile-trade'
import { createTradeRequest as createBulkTradeRequest, BulkSearch, requestTradeResultList } from './pathofexile-bulk'

export default defineComponent({
  name: 'TradeLinks',
  props: {
    filters: {
      type: Object as PropType<ItemFilters>
    },
    stats: {
      type: Array as PropType<StatFilter[]>
    },
    item: {
      type: Object as PropType<ParsedItem>
    },
    searchResult: {
      type: Object as PropType<SearchResult>
    },
    searchBulkResult: {
      type: Object as PropType<Record<'chaos' | 'exa', {
        listed: Ref<BulkSearch | null>
      }>>
    },
    selectedCurr: {
      type: String as PropType<'chaos' | 'exa'>
    },
    league: {
      type: String
    },
    tradeAPI: {
      type: String as PropType<'trade' | 'bulk'>,
      required: true
    }
  },
  setup (props) {
    const showBrowser = inject<(url: string) => void>('builtin-browser')!

    const { t } = useI18n()

    return {
      t,
      async openTradeLink (isExternal: boolean) {
        let link

        if (!props.league) return

        if (props.tradeAPI === 'trade') {
          if (props.searchResult) {
            link = `https://${getTradeEndpoint()}/trade/search/${props.league}/${props.searchResult.id}`
          } else if (props.filters && props.stats && props.item) {
            link = `https://${getTradeEndpoint()}/trade/search/${props.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item))}`
          }
        } else if (props.tradeAPI === 'bulk') {
          if (props.searchBulkResult && props.selectedCurr) {
            link = `https://${getTradeEndpoint()}/trade/exchange/${props.league}/${props.searchBulkResult![props.selectedCurr].listed.value!.queryId}`
          } else if (props.filters && props.stats && props.item) {
            const have = (props.item.info.refName === 'Chaos Orb')
              ? ['exalted']
              : (props.item.info.refName === 'Exalted Orb')
                  ? ['chaos']
                  : ['exalted', 'chaos']

            const tradeRequest = createBulkTradeRequest(props.filters, props.item, have)
            try {
              const response = await requestTradeResultList(tradeRequest, props.league)
              link = `https://${getTradeEndpoint()}/trade/exchange/${props.league}/${response.id}`
            } catch (err) {
              return
            }
          }
        }

        if (!link) return

        if (isExternal) {
          window.open(link)
        } else {
          showBrowser(link)
        }
      }
    }
  }
})
</script>
