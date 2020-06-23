<template>
  <div id="overlay-window" class="overflow-hidden relative w-full h-full">
    <div v-if="active" style="background: rgba(256,256,256,0.15); top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div>
    <div style="border: 4px solid red; top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div>
    <template v-for="widget of widgets">
      <component :key="widget.wmId"
        v-show="isVisible(widget.wmId)"
        :config="widget"
        :id="`widget-${widget.wmId}`"
        :is="`widget-${widget.wmType}`" />
    </template>
    <widget-debug id="widget-debug" />
    <div v-show="!gameFocused && !active">
      <div style="right: 24px; bottom: 24px; position: absolute;" class="bg-red-500 p-2 rounded">Game window is not active</div>
    </div>
  </div>
</template>

<script>
import { MainProcess } from '@/ipc/main-process-bindings'
import WidgetTimer from './WidgetTimer'
import WidgetInventorySearch from './WidgetInventorySearch'
import WidgetMenu from './WidgetMenu'
import PriceCheckWindow from '@/web/price-check/PriceCheckWindow'
import WidgetDebug from './WidgetDebug'
import WidgetMapCheck from '@/web/map-check/WidgetMapCheck'
import { FOCUS_CHANGE, VISIBILITY } from '@/ipc/ipc-event'
import { Config } from '@/web/Config'

export default {
  components: {
    WidgetTimer,
    WidgetInventorySearch,
    WidgetMenu,
    WidgetPriceCheck: PriceCheckWindow,
    WidgetDebug,
    WidgetMapCheck
  },
  provide () {
    return { wm: this }
  },
  data () {
    return {
      active: false,
      gameFocused: false,
      hideUI: false,
      devicePixelRatio: null
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
    }
  },
  created () {
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
      }

      if (this.active === false && this.gameFocused === false) {
        this.$nextTick(() => {
          Config.saveConfig()
        })
      }
    })
    MainProcess.addEventListener(VISIBILITY, ({ detail: e }) => {
      this.hideUI = !e.isVisible
    })
    window.addEventListener('resize', () => {
      this.devicePixelRatio = window.devicePixelRatio
    })
    this.devicePixelRatio = window.devicePixelRatio
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
      return this.widgets
        .filter(w => w.wmZorder !== 'exclusive')
        .sort((a, b) => b.wmZorder - a.wmZorder)[0] // guaranteed to always exist because of the 'widget-menu'
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
        wmZorder: undefined,
        wmFlags: ['uninitialized']
      })
    }
  }
}
</script>
