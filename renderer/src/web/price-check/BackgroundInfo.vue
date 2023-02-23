<template>
  <div v-if="updateInfo" class="bg-gray-900 mt-2 mx-4 rounded py-1 px-2">
    <p>{{ updateInfo.str1 }}</p>
    <p class="text-gray-500">{{ updateInfo.str2 }}</p>
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
import { defineComponent, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeagues } from '@/web/background/Leagues'
import { Host } from '@/web/background/IPC'
import { poeWebApi, AppConfig } from '@/web/Config'

export default defineComponent({
  setup () {
    const showBrowser = inject<(url: string) => void>('builtin-browser')!

    const { t } = useI18n()

    const updateInfo = computed(() => {
      const rawInfo = Host.updateInfo.value
      switch (rawInfo.state) {
        case 'update-downloaded':
          return { str1: t('updates.available', [rawInfo.version]), str2: t('updates.installed_on_exit') }
        case 'update-available':
          return (Host.isPortable.value || AppConfig().disableUpdateDownload)
            ? { str1: t('updates.available', [rawInfo.version]), str2: (Host.isPortable.value) ? t('updates.download_manually') : t('updates.download_disabled') }
            : null
        default:
          return null
      }
    })

    const leagues = useLeagues()

    return {
      t,
      updateInfo,
      leaguesError: leagues.error,
      loadingLeagues: leagues.isLoading,
      retry () {
        leagues.load()
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
    "Loading leagues...": "Загрузка лиг...",
    "Failed to load leagues": "Не удалось загрузить лиги",
    "leagues_failed": "Убедитесь, что сервера не находятся на обслуживании. Попробуйте нажать на кнопку \"Браузер\", возможно, там будет CAPTCHA."
  }
}
</i18n>
