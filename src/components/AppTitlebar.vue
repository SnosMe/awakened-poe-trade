<template>
  <div class="titlebar">
    <div class="flex">
      <button v-if="isLoading"
        class="titlebar-btn" title="Update price data"><i class="fas fa-sync-alt fa-spin"></i></button>
      <ui-popper v-if="exaltedCost" trigger="clickToToggle">
        <template slot="reference">
          <button class="titlebar-btn"><i class="fas fa-exchange-alt mt-px"></i> {{ exaltedCost }}</button>
        </template>
        <div class="popper">
          <div>TODO POG</div>
        </div>
      </ui-popper>
    </div>
    <div class="text-gray-600 truncate leading-none px-4">Awakened PoE Trade</div>
    <div class="flex">
      <button @click="hideWindow" tabindex="-1"
        class="titlebar-btn app-close pt-px" title="Close"><i class="fas fa-window-close"></i></button>
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
    isLoading: () => Leagues.isLoading || Prices.isLoading,
    exaltedCost () {
      if (!Prices.isLoaded) return null

      return Math.round(Prices.exaToChaos(1))
    }
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
  height: 1.5rem;
}

.titlebar-btn {
  -webkit-app-region: no-drag;
  @apply text-gray-600;
  line-height: 1.5rem;
  height: 1.5rem;
  @apply px-2;

  &:hover {
    @apply text-gray-500;
  }

  &.app-close {
    &:hover {
      @apply text-red-200 bg-red-500;
    }
  }
}
</style>
