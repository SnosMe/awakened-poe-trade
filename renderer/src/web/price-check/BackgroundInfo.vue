<template>
  <div v-if="updateInfo" class="bg-gray-900 mt-2 mx-4 rounded py-1 px-2">
    <p>{{ updateInfo.str1 }}</p>
    <p class="text-gray-500">{{ updateInfo.str2 }}</p>
  </div>
  <div v-if="leagues.isLoading.value" class="pt-2 px-4">
    <i class="fas fa-info-circle text-gray-600"></i> {{ t('app.leagues_loading') }}</div>
  <ui-error-box class="mx-4 mt-4" v-else-if="leagues.error.value">
    <template #name>{{ t('app.leagues_failed') }}</template>
    <p>{{ t('app.leagues_failed_help') }}</p>
    <template #actions>
      <button class="btn" @click="leagues.load">{{ t('Retry') }}</button>
      <button class="btn" @click="openCaptcha">{{ t('Browser') }}</button>
    </template>
  </ui-error-box>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeagues } from '@/web/background/Leagues'
import { Host } from '@/web/background/IPC'
import { poeWebApi } from '@/web/Config'

import UiErrorBox from '@/web/ui/UiErrorBox.vue'

const showBrowser = inject<(url: string) => void>('builtin-browser')!

const { t } = useI18n()

const updateInfo = computed(() => {
  const rawInfo = Host.updateInfo.value
  switch (rawInfo.state) {
    case 'update-downloaded':
      return { str1: t('updates.available', [rawInfo.version]), str2: t('updates.installed_on_exit') }
    case 'update-available':
      return (rawInfo.noDownloadReason)
        ? { str1: t('updates.available', [rawInfo.version]), str2: (rawInfo.noDownloadReason === 'not-supported') ? t('updates.download_manually') : t('updates.download_disabled') }
        : null
    default:
      return null
  }
})

const leagues = useLeagues()

function openCaptcha () {
  showBrowser(`https://${poeWebApi()}/api/leagues?type=main&realm=pc&compact=1`)
}
</script>
