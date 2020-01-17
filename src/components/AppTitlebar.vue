<template>
  <div class="titlebar">
    <div class="flex">
      <button v-if="isLoading"
        class="button" title="Update price data"><i class="fas fa-sync-alt fa-spin"></i></button>
    </div>
    <div class="text-gray-600 truncate leading-none px-4">Awakened PoE Trade</div>
    <div class="flex">
      <button @click="hideWindow" tabindex="-1" class="button" title="Close"><i class="fas fa-window-close"></i></button>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { PRICE_CHECK_VISIBLE } from '../shared/ipc-event'
import { Leagues } from './Leagues'
import { Prices } from './Prices'

export default {
  name: 'AppTitlebar',
  computed: {
    isLoading: () => Leagues.isLoading || Prices.isLoading
  },
  methods: {
    hideWindow () {
      ipcRenderer.send(PRICE_CHECK_VISIBLE, false)
    }
  }
}
</script>

<style lang="postcss">
.titlebar {
  /* https://electronjs.org/docs/api/frameless-window */
  -webkit-app-region: drag;
  user-select: none;
  @apply bg-gray-900;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.titlebar .button {
  -webkit-app-region: no-drag;
  @apply text-gray-600;
  line-height: 1;
  @apply p-1;

  &:hover {
    @apply text-gray-500;
  }
}
</style>
