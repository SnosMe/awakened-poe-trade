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
      <div class="mb-4 italic text-gray-500">{{ t('Your items will be highlighted even if it is turned off') }}</div>
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
      <div class="flex-1 mb-1">{{ t('Show memorized cursor position') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.priceCheckShowCursor" :value="true" class="mr-4">{{ t('Yes') }}</ui-radio>
        <ui-radio v-model="config.priceCheckShowCursor" :value="false">{{ t('No') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ t('Extra time to prevent spurious Rate limiting') }}</div>
      <div class="mb-4 flex">
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
    "Your items will be highlighted even if it is turned off": "Ваши предметы будут подсвечены, даже если это отключено",
    "Fill stat values": "Заполнять значения свойств",
    "Exact roll": "Точное значение",
    "Show memorized cursor position": "Показывать запомненную позицию курсора",
    "Minimum buyout price": "Минимальная цена выкупа",
    "Chaos Orbs": "Сфер хаоса",
    "Extra time to prevent spurious Rate limiting": "Добавочное время для предотвращения ложного срабатывания ограничения на запросы",
    "seconds": "секунды"
  }
}
</i18n>
