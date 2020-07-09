<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ $t('Account name') }}</div>
      <div class="mb-4">
        <input v-model="config.accountName" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ $t('Show seller') }}</div>
      <div class="mb-1 flex">
        <ui-radio v-model="config.showSeller" :value="false" class="mr-4">{{ $t('No') }}</ui-radio>
        <ui-radio v-model="config.showSeller" value="account" class="mr-4">{{ $t('Account name') }}</ui-radio>
        <ui-radio v-model="config.showSeller" value="ign">{{ $t('Last character name') }}</ui-radio>
      </div>
      <div class="mb-4 italic text-gray-500">{{ $t('Your items will be highlighted even if it is turned off') }}</div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ $t('Fill stat values') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.searchStatRange" :value="10" class="mr-4">+-10%</ui-radio>
        <ui-radio v-model="config.searchStatRange" :value="0">{{ $t('Exact roll') }}</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">{{ $t('Show memorized cursor position') }}</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.priceCheckShowCursor" :value="true" class="mr-4">{{ $t('Yes') }}</ui-radio>
        <ui-radio v-model="config.priceCheckShowCursor" :value="false">{{ $t('No') }}</ui-radio>
      </div>
    </div>
  </div>
</template>

<script>
import { Config } from '@/web/Config'

export default {
  computed: {
    config () {
      return Config.store
    }
  }
}
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
    "Show memorized cursor position": "Показывать запомненную позицию курсора"
  }
}
</i18n>
