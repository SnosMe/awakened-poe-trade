<template>
  <div
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
    class="flex-grow flex h-full" :class="{
    'flex-row': clickPosition === 'stash',
    'flex-row-reverse': clickPosition === 'inventory',
  }">
    <div v-if="!isBrowserShown" class="layout-column flex-shrink-0"
      :style="{ width: poeUiWidth }">
    </div>
    <div id="price-window" class="layout-column flex-shrink-0 text-gray-200" style="width: 460px;"
      @mouseleave="handleMouseleave"
      @click="handleClick">
      <app-titlebar @close="closePriceCheck" :title="title">
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
      <div class="flex-grow layout-column min-h-0 bg-gray-800">
        <div id="home" class="flex-grow layout-column">
          <div class="flex-1"></div>
          <div class="flex-grow layout-column">
            <app-bootstrap />
            <template>
              <check-position-circle
                v-if="showTips"
                :position="checkPosition" style="z-index: -1;" />
              <unidentified-resolver :item="item" @identify="item = $event" />
              <checked-item :item="item" />
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="layout-column flex-1 min-w-0">
      <div class="flex" :class="{
        'flex-row': clickPosition === 'stash',
        'flex-row-reverse': clickPosition === 'inventory'
      }">
        <related-items :item="item" />
        <rate-limiter-state />
      </div>
    </div>
  </div>
</template>

<script>
import CheckedItem from './CheckedItem'
import AppBootstrap from './AppBootstrap'
import { MainProcess } from '@/ipc/main-process-bindings'
import { PRICE_CHECK, PRICE_CHECK_CANCELED } from '@/ipc/ipc-event'
import { Prices, displayRounding } from './Prices'
import { Leagues } from './Leagues'
import { parseClipboard } from '@/parser'
import RelatedItems from './related-items/RelatedItems'
import RateLimiterState from './trade/RateLimiterState'
import UnidentifiedResolver from './unidentified-resolver/UnidentifiedResolver'
import CheckPositionCircle from './CheckPositionCircle'

export default {
  components: {
    CheckedItem,
    UnidentifiedResolver,
    AppBootstrap,
    RelatedItems,
    RateLimiterState,
    CheckPositionCircle
  },
  filters: { displayRounding },
  inject: ['wm'],
  provide () {
    return { widget: this }
  },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  created () {
    MainProcess.addEventListener(PRICE_CHECK, ({ detail: e }) => {
      this.wm.closeBrowser(this.config.wmId)
      this.wm.show(this.config.wmId)
      this.checkPosition = {
        x: e.position.x - window.screenX,
        y: e.position.y - window.screenY
      }
      this.item = parseClipboard(e.clipboard)
      this.showTips = false
    })
    MainProcess.addEventListener(PRICE_CHECK_CANCELED, () => {
      this.wm.hide(this.config.wmId)
    })
    window.addEventListener('resize', this.updatePoeUiWidth)
    this.updatePoeUiWidth()
  },
  data () {
    return {
      poeUiWidth: '1px',
      checkPosition: { x: 1, y: 1 },
      item: null,
      showTips: false
    }
  },
  watch: {
    'wm.active' (isActive) {
      if (isActive) {
        this.showTips = true
      }
    }
  },
  computed: {
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
    },
    isBrowserShown () {
      return this.config.wmFlags.includes('has-browser')
    },
    clickPosition () {
      if (this.isBrowserShown) {
        return 'inventory'
      } else {
        return this.checkPosition.x > (window.innerWidth / 2)
          ? 'inventory'
          : 'stash'
          // or {chat, vendor, center of screen}
      }
    }
  },
  methods: {
    closePriceCheck () {
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
