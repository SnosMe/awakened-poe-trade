<template>
  <div id="overlay-window" class="overflow-hidden relative w-full h-full">
    <!-- <div style="border: 4px solid red; top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div> -->
    <div style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
      :style="{ background: overlayBackground }"
      @click="handleBackgroundClick"></div>
    <template v-for="widget of widgets" :key="widget.wmId">
      <component
        v-show="isVisible(widget.wmId)"
        :config="widget"
        :id="`widget-${widget.wmId}`"
        :is="`widget-${widget.wmType}`" />
    </template>
    <widget-debug id="widget-debug" />
    <loading-animation />
    <!-- <div v-show="!gameFocused && !active">
      <div style="right: 24px; bottom: 24px; position: absolute;" class="bg-red-500 p-2 rounded">Game window is not active</div>
    </div> -->
  </div>
</template>

<script>
import { MainProcess } from '@/ipc/main-process-bindings'
import WidgetTimer from './WidgetTimer'
import WidgetStashSearch from './WidgetStashSearch'
import WidgetMenu from './WidgetMenu'
import PriceCheckWindow from '@/web/price-check/PriceCheckWindow'
import WidgetDebug from './WidgetDebug'
import WidgetItemCheck from '@/web/item-check/WidgetItemCheck'
import WidgetImageStrip from './WidgetImageStrip'
import WidgetDelveGrid from './WidgetDelveGrid'
import { registerOtherServices } from '../other-services'
import { FOCUS_CHANGE, VISIBILITY } from '@/ipc/ipc-event'
import { Config } from '@/web/Config'
import LoadingAnimation from './LoadingAnimation.vue'
// ---
import '@/web/background/AutoUpdates'
import '@/web/background/Prices'
import { load as loadLeagues } from '@/web/background/Leagues'

export default {
  components: {
    WidgetTimer,
    WidgetStashSearch,
    WidgetMenu,
    WidgetPriceCheck: PriceCheckWindow,
    WidgetDebug,
    WidgetItemCheck,
    WidgetImageStrip,
    WidgetDelveGrid,
    LoadingAnimation
  },
  provide () {
    return { wm: this }
  },
  data () {
    return {
      active: false,
      gameFocused: false,
      hideUI: false,
      devicePixelRatio: null,
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  watch: {
    devicePixelRatio: {
      immediate: false,
      handler (dpr) {
        MainProcess.dprChanged(dpr)
      }
    },
    visibilityState (stateNow, stateOld) {
      for (const w of this.widgets) {
        if (w.wmFlags.includes('has-browser')) {
          const vNow = stateNow.find(_ => _.wmId === w.wmId)
          const vOld = stateOld.find(_ => _.wmId === w.wmId)
          if (vNow.isVisible === (vOld && vOld.isVisible)) return

          if (vNow.isVisible) {
            this.showBrowser(w.wmId)
          } else {
            this.hideBrowser(w.wmId)
          }
        }
      }
    },
    active (active) {
      if (!active) {
        this.$nextTick(() => {
          Config.saveConfig()
        })
      }
    }
  },
  created () {
    loadLeagues()

    MainProcess.addEventListener(FOCUS_CHANGE, ({ detail: state }) => {
      this.active = state.overlay
      this.gameFocused = state.game

      if (this.active === false) {
        for (const w of this.widgets) {
          if (w.wmFlags.includes('hide-on-blur')) {
            this.hide(w.wmId)
          } else if (w.wmFlags.includes('hide-on-blur(close)')) {
            if (!state.usingHotkey) {
              this.hide(w.wmId)
            }
          }
        }
      } else {
        for (const w of this.widgets) {
          if (w.wmFlags.includes('hide-on-focus')) {
            this.hide(w.wmId)
          }
        }
      }
    })
    MainProcess.addEventListener(VISIBILITY, ({ detail: e }) => {
      this.hideUI = !e.isVisible
    })
    window.addEventListener('resize', () => {
      this.devicePixelRatio = window.devicePixelRatio
      this.width = window.innerWidth
      this.height = window.innerHeight
    })
    this.devicePixelRatio = window.devicePixelRatio // trigger watcher
    registerOtherServices()
  },
  mounted () {
    this.$nextTick(() => {
      MainProcess.readyReceiveEvents()
    })
  },
  computed: {
    widgets: {
      get () {
        return Config.store.widgets
      },
      set (value) {
        Config.store.widgets = value
      }
    },
    visibilityState () {
      let showExclusive = this.widgets.find(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')
      if (!this.active && showExclusive && showExclusive.wmFlags.includes('invisible-on-blur')) {
        showExclusive = undefined
      }

      return this.widgets.map(w => ({
        wmId: w.wmId,
        isVisible:
          this.hideUI ? false
            : !this.active && w.wmFlags.includes('invisible-on-blur') ? false
                : showExclusive ? w === showExclusive
                  : w.wmWants === 'show'
      }))
    },
    topmostWidget () {
      // guaranteed to always exist because of the 'widget-menu'
      return this.widgets
        .filter(w => w.wmZorder !== 'exclusive' && w.wmZorder != null)
        .sort((a, b) => b.wmZorder - a.wmZorder)[0]
    },
    topmostOrExclusiveWidget () {
      const showExclusive = this.widgets.find(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')

      return showExclusive || this.topmostWidget
    },
    poeUiWidth () {
      // sidebar is 370px at 800x600
      const ratio = 370 / 600
      return Math.round(this.height * ratio)
    },
    overlayBackground () {
      if (!this.active) return undefined

      if (this.topmostOrExclusiveWidget.wmZorder === 'exclusive') {
        if (!Config.store.overlayBackgroundExclusive) {
          return undefined
        }
      }
      return Config.store.overlayBackground
    }
  },
  methods: {
    isVisible (wmId) {
      return this.visibilityState
        .find(_ => _.wmId === wmId)
        .isVisible
    },
    show (wmId) {
      this.bringToTop(wmId)
      if (this.topmostOrExclusiveWidget.wmZorder === 'exclusive') {
        this.hide(this.topmostOrExclusiveWidget.wmId)
      }
      this.widgets.find(_ => _.wmId === wmId).wmWants = 'show'
    },
    hide (wmId) {
      this.widgets.find(_ => _.wmId === wmId).wmWants = 'hide'
    },
    remove (wmId) {
      this.widgets = this.widgets.filter(_ => _.wmId !== wmId)
    },
    showBrowser (wmId, url) {
      this.setFlag(wmId, 'has-browser', true)
      MainProcess.openAppBrowser({ url })
    },
    closeBrowser (wmId) {
      const widget = this.widgets.find(_ => _.wmId === wmId)
      if (widget.wmFlags.includes('has-browser')) {
        this.setFlag(wmId, 'has-browser', false)
        MainProcess.hideAppBrowser({ close: true })
      }
    },
    hideBrowser (wmId) {
      const widget = this.widgets.find(_ => _.wmId === wmId)
      if (widget.wmFlags.includes('has-browser')) {
        MainProcess.hideAppBrowser({ close: false })
      }
    },
    setFlag (wmId, flag, state) {
      const widget = this.widgets.find(_ => _.wmId === wmId)
      const hasFlag = widget.wmFlags.includes(flag)
      if (state === false && hasFlag === true) {
        widget.wmFlags = widget.wmFlags.filter(_ => _ !== flag)
        return true
      }
      if (state === true && hasFlag === false) {
        widget.wmFlags.push(flag)
        return true
      }
      return false
    },
    bringToTop (wmId) {
      if (wmId === this.topmostWidget.wmId) return

      const widget = this.widgets.find(_ => _.wmId === wmId)
      if (widget.wmZorder !== 'exclusive') {
        widget.wmZorder = this.topmostWidget.wmZorder + 1
      }
    },
    create (wmType) {
      this.widgets.push({
        wmId: Math.max(0, ...this.widgets.map(_ => _.wmId)) + 1,
        wmType,
        wmTitle: '',
        wmWants: 'hide',
        wmZorder: null,
        wmFlags: ['uninitialized']
      })
    },
    handleBackgroundClick () {
      if (Config.store.overlayBackgroundClose) {
        MainProcess.closeOverlay()
      }
    }
  }
}
</script>
