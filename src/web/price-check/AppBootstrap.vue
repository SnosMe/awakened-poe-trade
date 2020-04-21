<template>
  <div class="flex flex-col">
    <div v-if="updateInfo" class="bg-gray-900 mt-2 mx-4 rounded flex items-baseline justify-between py-1 px-2">
      <div class="font-sans">
        <div>Update available: {{ updateInfo.version }}</div>
        <div class="text-gray-500" v-if="updateInfo.auto">It will be installed automatically on exit</div>
        <div class="text-gray-500" v-else>You can download it from GitHub</div>
      </div>
      <button @click="updateInfo = null"><i class="fas fa-times"></i></button>
    </div>
    <div v-if="leaguesService.isLoading"
      class="py-1 px-2">
      <i class="fas fa-info-circle text-gray-600"></i> Loading leagues...</div>
    <div class="py-1 px-2 flex items-baseline" v-else-if="leaguesService.loadingError">
      <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
      <div>
        <div>
          <span class="text-red-400">Failed to load leagues</span>
          <button class="btn ml-2" @click="retry">Retry</button>
        </div>
        <pre class="text-gray-500 whitespace-normal">Error: {{ leaguesService.loadingError }}</pre>
        <div class="font-fontin-bold">Verify that the realm is not under maintenance and pathofexile.com is loading.</div>
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
    }
  }
}
</script>
