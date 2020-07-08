<template>
  <div class="flex flex-col">
    <div v-if="updateInfo" class="bg-gray-900 mt-2 mx-4 rounded flex items-baseline justify-between py-1 px-2">
      <div class="font-sans">
        <div>{{ $t('Update available: {0}', [updateInfo.version]) }}</div>
        <div class="text-gray-500" v-if="updateInfo.auto">{{ $t('It will be installed automatically on exit') }}</div>
        <div class="text-gray-500" v-else>{{ $t('You can download it from GitHub') }}</div>
      </div>
      <button @click="updateInfo = null"><i class="fas fa-times"></i></button>
    </div>
    <div v-if="leaguesService.isLoading"
      class="py-1 px-2">
      <i class="fas fa-info-circle text-gray-600"></i> {{ $t('Loading leagues...') }}</div>
    <div class="py-1 px-2 flex items-baseline" v-else-if="leaguesService.loadingError">
      <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
      <div>
        <div>
          <span class="text-red-400">{{ $t('Failed to load leagues') }}</span>
          <button class="btn ml-2" @click="retry">{{ $t('Retry') }}</button>
          <button class="btn ml-1" @click="openCaptcha">{{ $t('Browser') }}</button>
        </div>
        <!-- <pre class="text-gray-500 whitespace-normal">Error: {{ leaguesService.loadingError }}</pre> -->
        <div class="font-fontin-bold">{{ $t('Verify that the realm is not under maintenance and pathofexile.com is loading.') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { Leagues } from './Leagues'
import { Prices } from './Prices'
import { MainProcess } from '@/ipc/main-process-bindings'
import { UPDATE_AVAILABLE } from '@/ipc/ipc-event'

export default {
  name: 'AppBootstrap',
  created () {
    this.retry()

    MainProcess.addEventListener(UPDATE_AVAILABLE, ({ detail: updateInfo }) => {
      this.updateInfo = updateInfo
    })
  },
  inject: ['wm', 'widget'],
  data () {
    return {
      updateInfo: null
    }
  },
  computed: {
    leaguesService: () => Leagues
  },
  methods: {
    async retry () {
      await Leagues.load()
      if (Leagues.isLoaded) {
        Prices.load()
      }
    },
    openCaptcha () {
      this.wm.showBrowser(this.widget.config.wmId, 'https://api.pathofexile.com/leagues?type=main&realm=pc&compact=1')
    }
  }
}
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
