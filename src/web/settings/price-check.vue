<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Account name') }}</div>
      <div class="mb-4">
        <input v-model="config.accountName" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show seller') }}</div>
      <div class="mb-1 flex">
        <ui-radio v-model="config.showSeller" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="config.showSeller" value="account" class="mr-4">{{ t('Account name') }}</ui-radio>
        <ui-radio v-model="config.showSeller" value="ign">{{ t('Last character name') }}</ui-radio>
      </div>
      <div class="mb-4 italic text-gray-500">{{ t('Your items will be highlighted even if this setting is off') }}</div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Fill stat values') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <span class="mr-1">+-</span>
          <input v-model.number="searchStatRange" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-fontin-regular text-center" />
          <span class="ml-1">%</span>
        </div>
        <ui-radio v-model="searchStatRange" :value="0">{{ t('Exact roll') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Minimum buyout price') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <input v-model.number="chaosPriceThreshold" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-fontin-regular text-center" />
          <span class="ml-2">{{ t('Chaos Orbs') }}</span>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Always select "Stock" filter') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="configWidget.activateStockFilter" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="configWidget.activateStockFilter" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show memorized cursor position') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.priceCheckShowCursor" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="config.priceCheckShowCursor" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2 bg-orange-800 p-2">{{ t('Settings below are a compromise between increasing load on PoE website and convenient price checking / more accurate search.') }}</div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show indication on collapsed listings') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="configWidget.collapseListings" value="api" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="configWidget.collapseListings" value="app">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2" >
      <div class="flex-1 mb-1">{{ t('Perform an auto search, when pressing') }}</div>
      <div class="mb-4 flex">
        <ui-toggle v-if="config.priceCheckKey"
          v-model="configWidget.smartInitialSearch" class="mr-6">
          <span class="bg-gray-900 text-gray-500 rounded px-2">{{ `${config.priceCheckKeyHold} + ${config.priceCheckKey}` }}</span>
        </ui-toggle>
        <ui-toggle v-if="config.priceCheckLocked"
          v-model="configWidget.lockedInitialSearch">
          <span class="bg-gray-900 text-gray-500 rounded px-2">{{ config.priceCheckLocked }}</span>
        </ui-toggle>
      </div>
    </div>
    <div class="mb-2 border p-2 border-gray-600 border-dashed">
      <div class="flex-1 mb-1">{{ t('Extra time to prevent spurious Rate limiting') }}</div>
      <div class="flex">
        <div class="flex mr-6">
          <input v-model.number="apiLatencySeconds" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-fontin-regular text-center" />
          <span class="ml-2">{{ t('seconds') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Config } from '@/web/Config'
import { PriceCheckWidget } from '../overlay/interfaces'

export default defineComponent({
  setup () {
    const configWidget = computed(() => {
      return Config.store.widgets.find(w => w.wmType === 'price-check') as PriceCheckWidget
    })

    const { t } = useI18n()

    return {
      t,
      config: computed(() => Config.store),
      configWidget,
      searchStatRange: computed<number>({
        get () {
          return Config.store.searchStatRange
        },
        set (value) {
          if (typeof value !== 'number') return

          if (value >= 0 && value <= 50) {
            Config.store.searchStatRange = value
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
      })
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Account name": "Имя учетной записи",
    "Show seller": "Показывать продавца",
    "Last character name": "Имя последнего персонажа",
    "Your items will be highlighted even if this setting is off": "Ваши предметы будут подсвечены, даже если эта настройка выключена",
    "Fill stat values": "Заполнять значения свойств",
    "Exact roll": "Точное значение",
    "Show memorized cursor position": "Показывать запомненную позицию курсора",
    "Minimum buyout price": "Минимальная цена выкупа",
    "Chaos Orbs": "Сфер хаоса",
    "Extra time to prevent spurious Rate limiting": "Добавочное время для предотвращения ложного срабатывания ограничения на запросы",
    "seconds": "секунды",
    "Settings below are a compromise between increasing load on PoE website and convenient price checking / more accurate search.": "Настройки ниже являются компромиссом между увеличенной нагрузкой на сайт PoE и удобством проверки цен / более точным поиском.",
    "Show indication on collapsed listings": "Показывать индикацию на сгруппированных результатах",
    "Perform an auto search, when pressing": "Выполнять автоматический поиск при нажатии",
    "Always select \"Stock\" filter": "Всегда активировать фильтр \"Запас\""
  }
}
</i18n>
