<template>
  <div class="max-w-md p-2">
    <div class="mb-2" v-if="!leagues.error.value">
      <div class="flex-1 mb-1">{{ t('League') }}
        <button class="btn" @click="leagues.load" :disabled="leagues.isLoading.value">{{ t('Refresh') }}</button>
      </div>
      <div v-if="leagues.isLoading.value" class="mb-4">
        <i class="fas fa-info-circle text-gray-600"></i> {{ t('Loading leagues...') }}</div>
      <template v-else-if="leagues.trade.value.length">
        <div
          class="mb-2 grid grid-cols-2 gap-x-2 gap-y-1 whitespace-nowrap"
          style="grid-template-columns: repeat(2, min-content);">
          <div v-for="league of leagues.trade.value" :key="league.id">
            <ui-radio v-model="leagueId" :value="league.id">{{ league.id }}</ui-radio>
          </div>
        </div>
        <div class="flex gap-x-2 mb-4">
          <div class="text-gray-500">{{ t('or Private League') }}</div>
          <input v-model="customLeagueId" placeholder="My League (PL12345)" class="rounded bg-gray-900 px-1 mb-1 flex-1" />
        </div>
      </template>
    </div>
    <ui-error-box v-else class="mb-4">
      <template #name>{{ t('Failed to load leagues') }}</template>
      <p>{{ t('Price check Item, and follow the instructions in the error description.') }}</p>
      <template #actions>
        <button class="btn" @click="leagues.load">{{ t('Retry') }}</button>
      </template>
    </ui-error-box>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Account name') }}</div>
      <div class="mb-4">
        <input v-model="accountName" class="rounded bg-gray-900 px-1 block w-full mb-1 font-poe" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show seller') }}</div>
      <div class="mb-1 flex">
        <ui-radio v-model="showSeller" :value="false" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="showSeller" value="account" class="mr-4">{{ t('Account name') }}</ui-radio>
        <ui-radio v-model="showSeller" value="ign">{{ t('Last character name') }}</ui-radio>
      </div>
      <div class="mb-4 italic text-gray-500">{{ t('Your items will be highlighted even if this setting is off') }}</div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Fill stat values') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <span class="mr-1">+-</span>
          <input v-model.number="searchStatRange" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
          <span class="ml-1">%</span>
        </div>
        <ui-radio v-model="searchStatRange" :value="0">{{ t('Exact roll') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Minimum buyout price') }}</div>
      <div class="mb-4 flex">
        <div class="flex mr-6">
          <input v-model.number="chaosPriceThreshold" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-poe text-center" />
          <span class="ml-2">{{ t('Chaos Orbs') }}</span>
        </div>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Always select "Stock" filter') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="activateStockFilter" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="activateStockFilter" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show price prediction') }} <span class="bg-gray-700 px-1 rounded">www.poeprices.info</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="requestPricePrediction" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="requestPricePrediction" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show memorized cursor position') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="showCursor" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="showCursor" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2 bg-orange-800 p-2">{{ t('Settings below are a compromise between increasing load on PoE website and convenient price checking / more accurate search.') }}</div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Show indication on collapsed listings') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="collapseListings" value="api" class="mr-4">{{ t('No') }}</ui-radio>
        <ui-radio v-model="collapseListings" value="app">{{ t('Yes') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2" >
      <div class="flex-1 mb-1">{{ t('Perform an auto search, when pressing') }}</div>
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
      <div class="flex-1 mb-1">{{ t('Extra time to prevent spurious Rate limiting') }}</div>
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
import { useI18n } from 'vue-i18n'
import { configModelValue, configProp, findWidget } from './utils'
import type { PriceCheckWidget } from '@/web/overlay/interfaces'
import * as Leagues from '../background/Leagues'

export default defineComponent({
  name: 'Price check',
  props: configProp(),
  setup (props) {
    const configWidget = computed(() => findWidget<PriceCheckWidget>('price-check', props.config)!)

    const { t } = useI18n()

    return {
      t,
      leagueId: configModelValue(() => props.config, 'leagueId'),
      customLeagueId: computed<string>({
        get: () => !Leagues.isPublicLeague(props.config.leagueId ?? '')
          ? props.config.leagueId ?? ''
          : '',
        set: (value) => { props.config.leagueId = value }
      }),
      accountName: configModelValue(() => props.config, 'accountName'),
      showSeller: configModelValue(() => configWidget.value, 'showSeller'),
      activateStockFilter: configModelValue(() => configWidget.value, 'activateStockFilter'),
      showCursor: configModelValue(() => configWidget.value, 'showCursor'),
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
      leagues: {
        trade: Leagues.tradeLeagues,
        isLoading: Leagues.isLoading,
        error: Leagues.error,
        load: Leagues.load
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Account name": "Имя учетной записи",
    "or Private League": "или Приватная лига",
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
    "Always select \"Stock\" filter": "Всегда активировать фильтр \"Запас\"",
    "League": "Лига",
    "Loading leagues...": "Загрузка лиг...",
    "Failed to load leagues": "Не удалось загрузить лиги",
    "Price check Item, and follow the instructions in the error description.": "Прайс-чекните предмет, и следуйте инструкции в описании ошибки.",
    "Show price prediction": "Показывать приблизительную цену"
  },
  "zh_CN": {
    "Account name": "帐号",
    "or Private League": "或私人赛季",
    "Show seller": "显示卖家",
    "Last character name": "最近角色名称",
    "Your items will be highlighted even if this setting is off": "即使此设置关闭, 你的物品亦会高亮显示",
    "Fill stat values": "填充词缀数值",
    "Exact roll": "精确数值",
    "Show memorized cursor position": "显示已记忆光标位置",
    "Minimum buyout price": "最低一口价",
    "Chaos Orbs": "混沌石",
    "Extra time to prevent spurious Rate limiting": "搜索频率额外间隔时间以防触发搜索限制",
    "seconds": "秒",
    "Settings below are a compromise between increasing load on PoE website and convenient price checking / more accurate search.": "以下设置将影响服务器负载与搜索价格精度之间的平衡.",
    "Show indication on collapsed listings": "显示被折叠列表标记",
    "Perform an auto search, when pressing": "按住则自动搜索",
    "Always select \"Stock\" filter": "总是选择 \"存量\" 过滤",
    "League": "赛季",
    "Loading leagues...": "载入赛季...",
    "Failed to load leagues": "赛季载入失败",
    "Price check Item, and follow the instructions in the error description.": "物品价格搜索, 请按错误信息指示操作.",
    "Show price prediction": "显示价格预测"
  },
  "cmn-Hant": {
    "Account name": "帳號",
    "or Private League": "或私人賽季",
    "Show seller": "顯示賣家",
    "Last character name": "最近角色名稱",
    "Your items will be highlighted even if this setting is off": "即使此設置關閉, 你的物品亦會高亮顯示",
    "Fill stat values": "填充詞綴數值",
    "Exact roll": "精確數值",
    "Show memorized cursor position": "顯示已記憶光標位置",
    "Minimum buyout price": "最低一口價",
    "Chaos Orbs": "混沌石",
    "Extra time to prevent spurious Rate limiting": "搜索頻率額外間隔時間以防觸發搜索限製",
    "seconds": "秒",
    "Settings below are a compromise between increasing load on PoE website and convenient price checking / more accurate search.": "以下設置將影響服務器負載與搜索價格精度之間的平衡.",
    "Show indication on collapsed listings": "顯示被折疊列表標記",
    "Perform an auto search, when pressing": "按住則自動搜索",
    "Always select \"Stock\" filter": "總是選擇 \"存量\" 過濾",
    "League": "聯盟",
    "Loading leagues...": "載入聯盟...",
    "Failed to load leagues": "聯盟載入失敗",
    "Price check Item, and follow the instructions in the error description.": "物品價格搜索, 請按錯誤信息指示操作.",
    "Show price prediction": "顯示價格預測"
  }
}
</i18n>
