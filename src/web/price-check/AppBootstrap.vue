<template>
  <div class="flex flex-col">
    <div v-if="leaguesService.isLoading"
      class="bg-gray-800 text-gray-200 py-1 px-2">
      <i class="fas fa-info-circle text-gray-600"></i> Loading leagues...</div>
    <div class="bg-gray-800 text-gray-200 py-1 px-2 flex items-baseline" v-else-if="leaguesService.loadingError">
      <i class="fas fa-exclamation-circle pr-1 text-red-600"></i>
      <div>
        <div>
          <span class="text-red-400">Failed to load leagues</span>
          <button class="btn ml-2" @click="retry">Retry</button>
        </div>
        <div>Error: {{ leaguesService.loadingError }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { Leagues } from './Leagues'
import { Prices } from './Prices'

export default {
  name: 'AppBootstrap',
  created () {
    this.retry()
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
