<template>
  <ui-popover :delay="[80, null]" placement="bottom-start" boundary="#price-window">
    <template #target>
      <button class="rounded mr-1 px-2 truncate" :class="showWarning() ? 'text-orange-500' : 'text-gray-500'">
        <span><i class="fas fa-history"></i> {{ t(popoverLabelId()) }}</span>
        <span v-if="showLeagueName()">, {{ filters.trade.league }}</span>
      </button>
    </template>
    <template #content>
      <online-filter-core class="p-2 bg-gray-800 text-gray-400"
        :filters="filters.trade"
        :api="api" />
    </template>
  </ui-popover>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18nNs } from '@/web/i18n'
import UiRadio from '@/web/ui/UiRadio.vue'
import UiToggle from '@/web/ui/UiToggle.vue'
import UiPopover from '@/web/ui/Popover.vue'
import OnlineFilterCore from './OnlineFilterCore.vue'
import type { ItemFilters } from '../filters/interfaces'
import { useLeagues } from '@/web/background/Leagues'

export default defineComponent({
  components: { UiRadio, UiToggle, UiPopover, OnlineFilterCore },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    api: {
      type: String as PropType<'trade' | 'bulk'>,
      required: true
    }
  },
  setup (props) {
    const leagues = useLeagues()
    const { t } = useI18nNs('online_filter')

    return {
      t,
      showLeagueName: () => leagues.selectedId.value !== props.filters.trade.league,
      showWarning: () => Boolean(
        (props.filters.trade.listed &&
          ['1day', '3days', '1week'].includes(props.filters.trade.listed)) ||
        (props.filters.trade.currency &&
          props.filters.trade.currency !== 'chaos_divine')
      ),
      popoverLabelId: () => {
        if (props.filters.trade.offline) {
          return 'Offline'
        } else if (props.api === 'trade' && props.filters.trade.merchantOnly) {
          return ':merchant_toggle'
        }
        return 'Online'
      }
    }
  }
})
</script>
