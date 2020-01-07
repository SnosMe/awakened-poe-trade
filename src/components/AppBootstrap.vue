<template>
  <div>
    <div v-if="leaguesService.isLoading"
      class="bg-gray-800 text-gray-200 py-1 px-2">
      <i class="fas fa-info-circle text-gray-600"></i> Loading leagues...</div>
    <div v-if="pricesService.isLoading"
      class="bg-gray-800 text-gray-200 py-1 px-2">
      <i class="fas fa-info-circle text-gray-600"></i> Updating price data... <span class="text-gray-500 font-semibold">{{ leaguesService.selected }}</span>
    </div>
  </div>
</template>

<script>
import { Leagues } from './Leagues'
import { Prices } from './Prices'

export default {
  name: 'AppBootstrap',
  async created () {
    await Leagues.load()
    await Prices.load()
  },
  computed: {
    leaguesService: () => Leagues,
    pricesService: () => Prices
  },
  methods: {
  }
}
</script>
