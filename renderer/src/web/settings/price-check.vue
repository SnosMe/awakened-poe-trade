<template>
  <div class="max-w-md p-2">
    <div class="mb-2" v-if="!leagues.error.value">
      <div class="flex-1 mb-1">{{ t('league') }}
        <button class="btn" @click="leagues.load" :disabled="leagues.isLoading.value">{{ t('Refresh') }}</button>
      </div>
      <div v-if="leagues.isLoading.value" class="mb-4">
        <i class="fas fa-info-circle text-gray-600"></i> {{ t('app.leagues_loading') }}</div>
      <template v-else-if="leagues.list.value.length">
        <div
          class="mb-2 grid grid-cols-2 gap-x-2 gap-y-1 whitespace-nowrap"
          style="grid-template-columns: repeat(2, min-content);">
          <div v-for="league of leagues.list.value" :key="league.id">
            <ui-radio v-model="leagueId" :value="league.id">{{ league.id }}</ui-radio>
          </div>
        </div>
        <div class="flex gap-x-2 mb-4">
          <div class="text-gray-500">{{ t('settings.private_league') }}</div>
          <input v-model="customLeagueId" placeholder="My League (PL12345)" class="rounded bg-gray-900 px-1 mb-1 flex-1" />
        </div>
      </template>
    </div>
    <ui-error-box v-else class="mb-4">
      <template #name>{{ t('app.leagues_failed') }}</template>
      <p>{{ t('app.leagues_failed_help_alt') }}</p>
      <template #actions>
        <button class="btn" @click="leagues.load">{{ t('Retry') }}</button>
      </template>
    </ui-error-box>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('settings.account_name') }}</div>
      <div class="mb-4">
        <input v-model="accountName" class="rounded bg-gray-900 px-1 block w-full mb-1 font-poe" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':show_seller') }}</div>
      <div class="mb-1 flex">
        <ui-radio v-model="showSeller" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="showSeller" value="account" class="mr-4">{{ t('settings.account_name') }}</ui-radio>
        <ui-radio v-model="showSeller" value="ign">{{ t('settings.last_char_name') }}</ui-radio>
      </div>
      <div class="mb-4 italic text-gray-500">{{ t(':highlight_hint') }}</div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':fill_rolls') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <span class="mr-1">+-</span>
          <input v-model.number="searchStatRange" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
          <span class="ml-1">%</span>
        </div>
        <ui-radio v-model="searchStatRange" :value="0">{{ t(':fill_roll_exact') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':min_price') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <input v-model.number="chaosPriceThreshold" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
          <span class="ml-2">{{ t(':min_price_in_chaos') }}</span>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':select_stock') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="activateStockFilter" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="activateStockFilter" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':show_prediction') }} <span class="bg-gray-700 px-1 rounded">www.poeprices.info</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="requestPricePrediction" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="requestPricePrediction" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':cursor_pos') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="showCursor" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="showCursor" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-6" :class="{ 'p-2 bg-orange-800 rounded': builtinBrowser }">
      <div class="flex-1 mb-1">{{ t(':enable_browser') }}</div>
      <div class="flex">
        <ui-radio v-model="builtinBrowser" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="builtinBrowser" :value="false">{{ t('No') }}</ui-radio>
      </div>
      <div v-if="builtinBrowser" class="mt-1">{{ t(':builtin_browser_warning') }}</div>
    </div>
    <div class="mb-2 bg-orange-800 p-2 rounded">{{ t(':warn_expensive') }}</div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t(':accurate_collapsed') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="collapseListings" value="api" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="collapseListings" value="app">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2" >
      <div class="flex-1 mb-1">{{ t(':auto_search') }}</div>
      <div class="mb-4 flex">
        <ui-toggle v-if="hotkeyQuick"
          v-model="smartInitialSearch" class="mr-6">
          <span class="bg-gray-900 text-gray-500 rounded px-2">{{ hotkeyQuick }}</span>
        </ui-toggle>
        <ui-toggle v-if="hotkeyLocked"
          v-model="lockedInitialSearch">
          <span class="bg-gray-900 text-gray-500 rounded px-2">{{ hotkeyLocked }}</span>
        </ui-toggle>
      </div>
    </div>
    <div class="mb-2 border p-2 border-gray-600 border-dashed">
      <div class="flex-1 mb-1">{{ t(':extra_delay') }}</div>
      <div class="flex">
        <div class="flex mr-6">
          <input v-model.number="apiLatencySeconds" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
          <span class="ml-2">{{ t('seconds') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18nNs } from '@/web/i18n'
import { configModelValue, configProp, findWidget } from './utils'
import type { PriceCheckWidget } from '@/web/overlay/interfaces'
import { useLeagues } from '../background/Leagues'

export default defineComponent({
  name: 'price_check.name',
  props: configProp(),
  setup (props) {
    const configWidget = computed(() => findWidget<PriceCheckWidget>('price-check', props.config)!)

    const leagues = useLeagues()
    const { t } = useI18nNs('price_check')

    return {
      t,
      leagueId: configModelValue(() => props.config, 'leagueId'),
      customLeagueId: computed<string>({
        get: () => !leagues.list.value.some(league => league.id === props.config.leagueId)
          ? props.config.leagueId ?? ''
          : '',
        set: (value) => { props.config.leagueId = value }
      }),
      accountName: configModelValue(() => props.config, 'accountName'),
      showSeller: configModelValue(() => configWidget.value, 'showSeller'),
      activateStockFilter: configModelValue(() => configWidget.value, 'activateStockFilter'),
      showCursor: configModelValue(() => configWidget.value, 'showCursor'),
      builtinBrowser: configModelValue(() => configWidget.value, 'builtinBrowser'),
      requestPricePrediction: configModelValue(() => configWidget.value, 'requestPricePrediction'),
      collapseListings: configModelValue(() => configWidget.value, 'collapseListings'),
      hotkeyQuick: computed(() => configWidget.value.hotkey
        ? `${configWidget.value.hotkeyHold} + ${configWidget.value.hotkey}`
        : null),
      hotkeyLocked: computed(() => configWidget.value.hotkeyLocked),
      smartInitialSearch: configModelValue(() => configWidget.value, 'smartInitialSearch'),
      lockedInitialSearch: configModelValue(() => configWidget.value, 'lockedInitialSearch'),
      searchStatRange: computed<number>({
        get () {
          return configWidget.value.searchStatRange
        },
        set (value) {
          if (typeof value !== 'number') return

          if (value >= 0 && value <= 50) {
            configWidget.value.searchStatRange = value
          }
        }
      }),
      chaosPriceThreshold: computed<number>({
        get () {
          return configWidget.value.chaosPriceThreshold
        },
        set (value) {
          if (typeof value !== 'number') return

          configWidget.value.chaosPriceThreshold = value
        }
      }),
      apiLatencySeconds: computed<number>({
        get () {
          return configWidget.value.apiLatencySeconds
        },
        set (value) {
          if (typeof value !== 'number') return

          configWidget.value.apiLatencySeconds = Math.min(Math.max(value, 0.5), 10)
        }
      }),
      leagues
    }
  }
})
</script>
