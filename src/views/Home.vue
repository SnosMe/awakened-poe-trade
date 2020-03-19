<template>
  <div class="flex-grow flex h-full" :class="clickPosition === 'stash' ? 'flex-row' : 'flex-row-reverse'">
    <div v-if="browserMode"
      class="w-full layout-column" style="width: calc(100% - 460px);">
      <browser-mode />
    </div>
    <div v-if="!isBrowserShown && !browserMode" class="layout-column"
      :style="{ width: poeUiWidth }">
    </div>
    <div id="price-window" class="flex-grow layout-column bg-gray-800 text-gray-200" style="max-width: 460px;"
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
      <div class="flex-grow layout-column min-h-0">
        <router-view/>
        <div id="home" class="flex-grow layout-column">
          <div class="flex-1"></div>
          <div class="flex-grow layout-column">
            <app-bootstrap />
            <checked-item />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!browserMode" class="layout-column flex-1"
      :style="{ width: poeUiWidth }">
    </div>
  </div>
</template>

<script>
import AppTitlebar from '../components/AppTitlebar'
import BrowserMode from '../components/BrowserMode'
import CheckedItem from '../components/CheckedItem'
import AppBootstrap from '../components/AppBootstrap'
import { MainProcess } from '../components/main-process-bindings'
import { Prices, displayRounding } from '../components/Prices'
import { Leagues } from '../components/Leagues'

export default {
  components: {
    CheckedItem,
    AppBootstrap,
    AppTitlebar,
    BrowserMode
  },
  filters: { displayRounding },
  created () {
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        MainProcess.priceCheckHide()
      }
    })
    MainProcess.addEventListener('price-check', ({ detail: { position } }) => {
      this.clickPosition = position
      this.isBrowserShown = false
    })
    MainProcess.addEventListener('open-link', () => {
      this.clickPosition = 'inventory'
      this.isBrowserShown = true
    })
    window.addEventListener('resize', () => {
      this.updatePoeUiWidth()
    })
    this.updatePoeUiWidth()
  },
  data () {
    return {
      poeUiWidth: '0px',
      clickPosition: 'stash',
      isBrowserShown: false
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
