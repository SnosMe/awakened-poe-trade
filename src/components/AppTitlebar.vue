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
          <div class="flex items-center justify-center flex-1">
            <div class="w-8 h-8 flex items-center justify-center">
              <img src="https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyAddModToRare.png?scale=1&w=1&h=1" alt="exa" class="max-w-full max-h-full">
            </div>
            <i class="fas fa-arrow-right text-gray-600 px-2"></i>
            <span class="px-1 text-base">{{ exaltedCost | displayRounding(true) }} ×</span>
            <div class="w-8 h-8 flex items-center justify-center">
              <img src="https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png?scale=1&w=1&h=1" alt="chaos" class="max-w-full max-h-full">
            </div>
          </div>
          <div v-for="i in 9" :key="i">
            <div class="text-left pl-1">{{ i / 10 }} exa ⇒ {{ (exaltedCost * i / 10) | displayRounding(true) }} c</div>
          </div>
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
import { MainProcess } from './main-process-bindings'
import { Leagues } from './Leagues'
import { Prices, displayRounding } from './Prices'

export default {
  name: 'AppTitlebar',
  filters: { displayRounding },
  computed: {
    isLoading: () => Leagues.isLoading || Prices.isLoading,
    exaltedCost () {
      if (!Prices.isLoaded) return null

      return Math.round(Prices.exaToChaos(1))
    }
  },
  methods: {
    hideWindow () {
      MainProcess.priceCheckHide()
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
