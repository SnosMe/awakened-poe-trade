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
  <div class="pt-2 px-4 flex items-baseline" v-else-if="leaguesError">
    <i class="fas fa-exclamation-circle pr-1 text-red-400"></i>
    <div>
      <div>
        <span class="text-red-400">{{ t('Failed to load leagues') }}</span>
        <button class="btn ml-2" @click="retry">{{ t('Retry') }}</button>
        <button class="btn ml-1" @click="openCaptcha">{{ t('Browser') }}</button>
      </div>
      <div class="font-fontin-bold">{{ t('Verify that the realm is not under maintenance and pathofexile.com is loading.') }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { ComputedRef, defineComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { Widget, WidgetManager } from '../overlay/interfaces'
import * as Leagues from '@/web/background/Leagues'
import { updateInfo } from '@/web/background/AutoUpdates'

export default defineComponent({
  setup () {
    const wm = inject<WidgetManager>('wm')!
    const widget = inject<{ config: ComputedRef<Widget> }>('widget')!

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
        wm.showBrowser(widget.config.value.wmId, 'https://api.pathofexile.com/leagues?type=main&realm=pc&compact=1')
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Update available: {0}": "Доступно обновление: {0}",
    "It will be installed automatically on exit": "Оно будет установлено автоматически при выходе",
    "You can download it from GitHub": "Вы можете загрузить его с GitHub",
    "Loading leagues...": "Загрузка лиг...",
    "Failed to load leagues": "Не удалось загрузить лиги",
    "Verify that the realm is not under maintenance and pathofexile.com is loading.": "Убедитесь, что сервера не находятся на обслуживании и pathofexile.com загружается."
  }
}
</i18n>
