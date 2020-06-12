<template>
  <div id="overlay-window" class="overflow-hidden relative w-full h-full">
    <div v-if="active" style="background: rgba(256,256,256,0.15); top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div>
    <div style="border: 4px solid red; top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div>
    <div :class="{ 'opacity-0 pointer-e-none TODO ALL CLASSES_FUCK': hideUI }">
      <template v-for="widget of widgets">
        <component :key="widget.wmId"
          v-show="isVisible(widget.wmId)"
          :config="widget"
          :id="`widget-${widget.wmId}`"
          :is="`widget-${widget.wmType}`" />
      </template>
      <div v-show="!gameFocused && !active">
        <div style="right: 24px; bottom: 24px; position: absolute;" class="bg-red-500 p-2 rounded">Game window is not active</div>
      </div>
    </div>
  </div>
</template>

<script>
import { MainProcess } from '@/ipc/main-process-bindings'
import WidgetTimer from './WidgetTimer'
import WidgetInventorySearch from './WidgetInventorySearch'
import WidgetMenu from './WidgetMenu'
import PriceCheckWindow from '@/web/price-check/PriceCheckWindow'
import { FOCUS_CHANGE } from '@/ipc/ipc-event'

export default {
  components: {
    WidgetTimer,
    WidgetInventorySearch,
    WidgetMenu,
    WidgetPriceCheck: PriceCheckWindow
  },
  provide () {
    return { wm: this }
  },
  data () {
    return {
      active: false,
      gameFocused: false,
      hideUI: false,
      widgets: [
        {
          wmId: 1,
          wmType: 'timer',
          wmWants: 'show',
          wmTitle: 'Timer',
          wmFlags: [],
          anchor: {
            pos: 'cc',
            x: 10,
            y: 50
          }
        },
        {
          wmId: 4,
          wmType: 'menu',
          wmWants: 'show',
          wmFlags: ['invisible-on-blur', 'skip-menu'],
          anchor: {
            pos: 'tl',
            x: 5,
            y: 5
          }
        },
        {
          wmId: 2,
          wmType: 'inventory-search',
          wmFlags: ['invisible-on-blur'],
          wmWants: 'hide',
          anchor: {
            pos: 'tr',
            x: 81,
            y: 20
          },
          wmTitle: 'Map rolling',
          entries: [
            { id: 2, text: 'Reflect' },
            { id: 1, text: '"Quantity: +3"' },
            { id: 3, text: '"Cannot Leech Life"' },
            { id: 4, text: '"Cannot Leech Mana"' }
          ]
        },
        {
          wmId: 3,
          wmType: 'price-check',
          wmZorder: 'exclusive',
          wmWants: 'hide',
          wmFlags: ['hide-on-blur', 'skip-menu']
        }
      ],
      devicePixelRatio: null
    }
  },
  watch: {
    devicePixelRatio: {
      immediate: false,
      handler (dpr) {
        MainProcess.dprChanged(dpr)
      }
    }
  },
  created () {
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        MainProcess.priceCheckHide()
      }
    })
    MainProcess.addEventListener(FOCUS_CHANGE, ({ detail: state }) => {
      this.active = state.overlay
      this.gameFocused = state.game

      if (this.active === false) {
        for (const w of this.widgets) {
          if (w.wmFlags.includes('hide-on-blur')) {
            this.hide(w.wmId)
          }
        }
      }
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
    visibilityState () {
      const showExclusive = this.widgets.find(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')

      return this.widgets.map(w => ({
        wmId: w.wmId,
        isVisible: showExclusive
          ? w === showExclusive
          : !this.active && w.wmFlags.includes('invisible-on-blur')
            ? false
            : w.wmWants === 'show'
      }))
    }
  },
  methods: {
    isVisible (wmId) {
      return this.visibilityState
        .find(_ => _.wmId === wmId)
        .isVisible
    },
    show (wmId) {
      this.widgets.find(_ => _.wmId === wmId).wmWants = 'show'
    },
    hide (wmId) {
      this.widgets.find(_ => _.wmId === wmId).wmWants = 'hide'
    },
    remove (wmId) {
      this.widgets = this.widgets.filter(_ => _.wmId !== wmId)
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
