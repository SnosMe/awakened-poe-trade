<template>
  <div class="flex gap-x-8">
    <div class="flex flex-col gap-y-1">
      <div class="mb-1">
        <UiToggle
          :disabled="context === 'settings'"
          :modelValue="filters.offline"
          @update:modelValue="onOfflineUpdate">{{ t(':offline_toggle') }}</UiToggle>
      </div>
      <template v-if="api === 'trade'">
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" :value="null">{{ t(':listed_any_time') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="1day">{{ t(':listed_1day') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="3days">{{ t(':listed_3days') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="1week">{{ t(':listed_1week') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="2weeks">{{ t(':listed_2weeks') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="1month">{{ t(':listed_1month') }}</UiRadio>
        <UiRadio v-model="filters.listed" :disabled="context === 'settings'" value="2months">{{ t(':listed_2months') }}</UiRadio>
      </template>
    </div>
    <div class="flex flex-col gap-y-1">
      <div class="mb-1">
        <UiToggle v-if="api === 'bulk'" :class="{ 'invisible': filters.offline }"
          v-model="filters.onlineInLeague">{{ t(':in_league_toggle') }}</UiToggle>
        <UiToggle v-if="api === 'trade'" :class="{ 'invisible': filters.offline }"
          v-model="filters.merchantOnly">{{ t(':merchant_toggle') }}</UiToggle>
      </div>
      <UiRadio v-for="league of tradeLeagues" :key="league.id"
        v-model="filters.league" :value="league.id" :disabled="context === 'settings'">{{ league.id }}</UiRadio>
      <template v-if="api === 'trade'">
        <UiRadio class="mt-3" v-model="filters.currency" :value="null">{{ t(':currency_any') }}</UiRadio>
        <UiRadio v-model="filters.currency" value="chaos">{{ t(':currency_only_chaos') }}</UiRadio>
        <UiRadio v-model="filters.currency" value="divine">{{ t(':currency_only_div') }}</UiRadio>
        <UiRadio v-model="filters.currency" value="chaos_divine">{{ t(':currency_chaos_div') }}</UiRadio>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { useI18nNs } from '@/web/i18n'
import type { ItemFilters } from '../filters/interfaces'
import { useLeagues } from '@/web/background/Leagues'

import UiRadio from '@/web/ui/UiRadio.vue'
import UiToggle from '@/web/ui/UiToggle.vue'

const props = defineProps({
  filters: {
    type: Object as PropType<ItemFilters['trade']>,
    required: true
  },
  api: {
    type: String as PropType<'trade' | 'bulk'>,
    required: true
  },
  context: {
    type: String as PropType<'price-check' | 'settings'>,
    default: 'price-check'
  }
})

const { list: tradeLeagues } = useLeagues()
const { t } = useI18nNs('online_filter')

function onOfflineUpdate (offline: boolean) {
  const { filters } = props
  filters.offline = offline
  if (props.api === 'trade') {
    filters.listed = (offline) ? '2months' : null
  }
}
</script>
