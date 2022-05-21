<template>
  <div v-if="updateInfo" class="bg-gray-900 mt-2 mx-4 rounded flex items-baseline py-1 px-2">
    <div class="flex-1 font-sans">
      <div>{{ t('Update available: {0}', [updateInfo.version]) }}</div>
      <p class="text-gray-500">{{ t(updateInfo.auto
        ? 'It will be installed automatically on exit'
        : 'You can download it from GitHub') }}</p>
    </div>
    <button @click="updateInfo = null"><i class="fas fa-times"></i></button>
  </div>
  <div v-if="loadingLeagues" class="pt-2 px-4">
    <i class="fas fa-info-circle text-gray-600"></i> {{ t('Loading leagues...') }}</div>
  <ui-error-box class="mx-4 mt-4" v-else-if="leaguesError">
    <template #name>{{ t('Failed to load leagues') }}</template>
    <p>{{ t('leagues_failed') }}</p>
    <template #actions>
      <button class="btn" @click="retry">{{ t('Retry') }}</button>
      <button class="btn" @click="openCaptcha">{{ t('Browser') }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import * as Leagues from '@/web/background/Leagues'
import { updateInfo } from '@/web/background/AutoUpdates'
import { poeWebApi } from '@/web/Config'

export default defineComponent({
  setup () {
    const showBrowser = inject<(url: string) => void>('builtin-browser')!

    const { t } = useI18n()

    return {
      t,
      updateInfo,
      leaguesError: Leagues.error,
      loadingLeagues: Leagues.isLoading,
      retry () {
        Leagues.load()
      },
      openCaptcha () {
        showBrowser(`https://${poeWebApi()}/api/leagues?type=main&realm=pc&compact=1`)
      }
    }
  }
})
</script>

<i18n>
{
  "en": {
    "leagues_failed": "Make sure the realm is not under maintenance. Also try clicking on the \"Browser\" button, you may need to complete a CAPTCHA there."
  },
  "ru": {
    "Update available: {0}": "Доступно обновление: {0}",
    "It will be installed automatically on exit": "Оно будет установлено автоматически при выходе",
    "You can download it from GitHub": "Вы можете загрузить его с GitHub",
    "Loading leagues...": "Загрузка лиг...",
    "Failed to load leagues": "Не удалось загрузить лиги",
    "leagues_failed": "Убедитесь, что сервера не находятся на обслуживании. Попробуйте нажать на кнопку \"Браузер\", возможно, там будет CAPTCHA."
  }
}
</i18n>
