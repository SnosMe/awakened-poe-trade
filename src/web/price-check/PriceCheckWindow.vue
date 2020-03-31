<template>
  <div class="flex-grow flex h-full" :class="{
    'flex-row': clickPosition === 'stash',
    'flex-row-reverse': clickPosition === 'inventory',
  }">
    <div v-if="browserMode"
      class="w-full layout-column" style="width: calc(100% - 460px);">
      <browser-mode />
    </div>
    <div v-if="!isBrowserShown && !browserMode" class="layout-column"
      :style="{ width: poeUiWidth }">
    </div>
    <div id="price-window" class="flex-grow layout-column text-gray-200" style="max-width: 460px;"
      @mouseleave="handleMouseleave"
      @click="handleClick">
      <app-titlebar @close="hideWindow" :title="title">
        <div class="flex">
          <ui-popper v-if="exaltedCost" trigger="clickToToggle" boundaries-selector="#price-window">
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
          <button v-if="isLoading"
            class="titlebar-btn" title="Update price data"><i class="fas fa-sync-alt fa-spin"></i></button>
        </div>
      </app-titlebar>
      <div class="flex-grow layout-column min-h-0 bg-gray-800"
        :class="{ 'opacity-0': hideUI }">
        <div id="home" class="flex-grow layout-column">
          <div class="flex-1"></div>
          <div class="flex-grow layout-column">
            <app-bootstrap />
            <checked-item :item="item" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!browserMode" class="layout-column flex-1"
      :style="{ width: poeUiWidth }">
      <div class="flex" :class="{
        'flex-row': clickPosition === 'stash',
        'flex-row-reverse': clickPosition === 'inventory',
        'opacity-0': hideUI
      }">
        <related-items :item="item" />
        <rate-limiter-state />
      </div>
    </div>
  </div>
</template>

<script>
import BrowserMode from './BrowserMode'
import CheckedItem from './CheckedItem'
import AppBootstrap from './AppBootstrap'
import { MainProcess } from '@/ipc/main-process-bindings'
import { Prices, displayRounding } from './Prices'
import { Leagues } from './Leagues'
import { parseClipboard } from '@/parser'
import RelatedItems from './related-items/RelatedItems'
import RateLimiterState from './trade/RateLimiterState'

export default {
  components: {
    CheckedItem,
    AppBootstrap,
    BrowserMode,
    RelatedItems,
    RateLimiterState
  },
  filters: { displayRounding },
  created () {
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        MainProcess.priceCheckHide()
      }
    })
    MainProcess.addEventListener('price-check', ({ detail: { position, clipboard } }) => {
      this.clickPosition = position
      this.isBrowserShown = false
      this.hideUI = false
      this.item = parseClipboard(clipboard)
    })
    MainProcess.addEventListener('open-link', () => {
      this.clickPosition = 'inventory'
      this.isBrowserShown = true
    })
    window.addEventListener('resize', () => {
      this.updatePoeUiWidth()
    })
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Alt') {
        this.hideUI = true
      }
    })
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Alt') {
        this.hideUI = false
      }
    })
    window.addEventListener('blur', (e) => {
      // Alt+Tab
      this.hideUI = false
    })
    this.updatePoeUiWidth()
  },
  data () {
    return {
      poeUiWidth: '0px',
      clickPosition: 'stash',
      isBrowserShown: false,
      hideUI: false,
      item: null
    }
  },
  computed: {
    browserMode () {
      return !MainProcess.isElectron
    },
    title () {
      if (!Leagues.isLoaded) {
        return 'Awakened PoE Trade'
      } else {
        return Leagues.selected
      }
    },
    isLoading: () => Leagues.isLoading || Prices.isLoading,
    exaltedCost () {
      if (!Prices.isLoaded) return null

      return Math.round(Prices.exaToChaos(1))
    }
  },
  methods: {
    hideWindow () {
      MainProcess.priceCheckHide()
    },
    updatePoeUiWidth () {
      // sidebar is 370px at 800x600
      const ratio = 370 / 600
      this.poeUiWidth = `${Math.round(window.innerHeight * ratio)}px`
    },
    handleClick () {
      MainProcess.priceCheckMouse('click')
    },
    handleMouseleave () {
      if (!this.isBrowserShown) {
        MainProcess.priceCheckMouse('leave')
      }
    }
  }
}
</script>
