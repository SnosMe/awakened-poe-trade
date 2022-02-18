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

<script lang="ts">
import { defineComponent, provide, shallowRef, watch, readonly, computed, onMounted, nextTick } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { Widget, WidgetManager } from './interfaces'
import WidgetTimer from './WidgetTimer.vue'
import WidgetStashSearch from './WidgetStashSearch.vue'
import WidgetMenu from './WidgetMenu.vue'
import PriceCheckWindow from '@/web/price-check/PriceCheckWindow.vue'
import WidgetDebug from './WidgetDebug.vue'
import WidgetItemCheck from '@/web/item-check/WidgetItemCheck.vue'
import WidgetImageStrip from './WidgetImageStrip.vue'
import WidgetDelveGrid from './WidgetDelveGrid.vue'
import WidgetSettings from '../settings/SettingsWindow.vue'
import { AppConfig, saveConfig } from '@/web/Config'
import LoadingAnimation from './LoadingAnimation.vue'
// ---
import '@/web/background/AutoUpdates'
import '@/web/background/Prices'
import { load as loadLeagues } from '@/web/background/Leagues'
import { registerOtherServices } from '../other-services'

type WMID = Widget['wmId']

export default defineComponent({
  components: {
    WidgetTimer,
    WidgetStashSearch,
    WidgetMenu,
    WidgetPriceCheck: PriceCheckWindow,
    WidgetDebug,
    WidgetItemCheck,
    WidgetImageStrip,
    WidgetDelveGrid,
    WidgetSettings,
    LoadingAnimation
  },
  setup () {
    loadLeagues()

    const active = shallowRef(false)
    const gameFocused = shallowRef(false)
    const hideUI = shallowRef(false)

    watch(active, (active) => {
      if (!active) {
        nextTick(() => { saveConfig() })
      }
    })

    const widgets = computed<Widget[]>({
      get () {
        return AppConfig().widgets
      },
      set (value) {
        AppConfig().widgets = value
      }
    })

    MainProcess.onEvent('MAIN->OVERLAY::focus-change', (state) => {
      active.value = state.overlay
      gameFocused.value = state.game

      if (active.value === false) {
        for (const w of widgets.value) {
          if (w.wmFlags.includes('hide-on-blur')) {
            hide(w.wmId)
          } else if (w.wmFlags.includes('hide-on-blur(close)')) {
            if (!state.usingHotkey) {
              hide(w.wmId)
            }
          }
        }
      } else {
        for (const w of widgets.value) {
          if (w.wmFlags.includes('hide-on-focus')) {
            hide(w.wmId)
          }
        }
      }
    })
    MainProcess.onEvent('MAIN->OVERLAY::visibility', (e) => {
      hideUI.value = !e.isVisible
    })
    registerOtherServices()

    onMounted(() => {
      nextTick(() => {
        MainProcess.sendEvent({ name: 'OVERLAY->MAIN::ready', payload: undefined })
      })
    })

    const size = (() => {
      const size = shallowRef({
        devicePixelRatio: window.devicePixelRatio,
        width: window.innerWidth,
        height: window.innerHeight
      })
      window.addEventListener('resize', () => {
        size.value = {
          devicePixelRatio: window.devicePixelRatio,
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
      watch(size, (size, prev) => {
        if (size.devicePixelRatio !== prev.devicePixelRatio) {
          MainProcess.sendEvent({
            name: 'OVERLAY->MAIN::devicePixelRatio-change',
            payload: size.devicePixelRatio
          })
        }
      })
      return readonly(size)
    })()

    function show (wmId: WMID) {
      bringToTop(wmId)
      const topmostWidget = topmostOrExclusiveWidget.value
      if (topmostWidget.wmZorder === 'exclusive') {
        hide(topmostWidget.wmId)
      }
      widgets.value.find(_ => _.wmId === wmId)!.wmWants = 'show'
    }

    function hide (wmId: WMID) {
      widgets.value.find(_ => _.wmId === wmId)!.wmWants = 'hide'
    }

    function remove (wmId: WMID) {
      widgets.value = widgets.value.filter(_ => _.wmId !== wmId)
    }

    function setFlag (wmId: WMID, flag: Widget['wmFlags'][number], state: boolean) {
      const widget = AppConfig().widgets.find(_ => _.wmId === wmId)!
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
    }

    function bringToTop (wmId: WMID) {
      if (wmId === topmostWidget.value.wmId) return

      const widget = AppConfig().widgets.find(_ => _.wmId === wmId)!
      if (widget.wmZorder !== 'exclusive') {
        widget.wmZorder = (topmostWidget.value.wmZorder as number) + 1
      }
    }

    function create (wmType: Widget['wmType']) {
      AppConfig().widgets.push({
        wmId: Math.max(0, ...AppConfig().widgets.map(_ => _.wmId)) + 1,
        wmType,
        wmTitle: '',
        wmWants: 'hide',
        wmZorder: null,
        wmFlags: ['uninitialized']
      })
    }

    const visibilityState = computed(() => {
      let showExclusive = AppConfig().widgets
        .find(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')
      if (!active.value && showExclusive && showExclusive.wmFlags.includes('invisible-on-blur')) {
        showExclusive = undefined
      }

      return AppConfig().widgets.map(w => ({
        wmId: w.wmId,
        isVisible:
          hideUI.value ? (active.value && w.wmWants === 'show' && w.wmFlags.includes('ignore-ui-visibility'))
            : !active.value && w.wmFlags.includes('invisible-on-blur') ? false
                : showExclusive ? w === showExclusive
                  : w.wmWants === 'show'
      }))
    })

    const topmostWidget = computed<Widget>(() => {
      // guaranteed to always exist because of the 'widget-menu'
      return AppConfig().widgets
        .filter(w => w.wmZorder !== 'exclusive' && w.wmZorder != null)
        .sort((a, b) => (b.wmZorder as number) - (a.wmZorder as number))[0]
    })

    const topmostOrExclusiveWidget = computed<Widget>(() => {
      const showExclusive = AppConfig().widgets
        .find(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')

      return showExclusive || topmostWidget.value
    })

    const poePanelWidth = computed(() => {
      // sidebar is 986px at Wx1600H
      const ratio = 986 / 1600
      return Math.round(size.value.height * ratio)
    })

    provide<WidgetManager>('wm', {
      poePanelWidth,
      size,
      active,
      widgets: computed(() => AppConfig().widgets),
      show,
      hide,
      remove,
      bringToTop,
      create,
      setFlag
    })

    function handleBackgroundClick () {
      if (AppConfig().overlayBackgroundClose) {
        MainProcess.closeOverlay()
      }
    }

    const overlayBackground = computed<string | undefined>(() => {
      if (!active.value) return undefined

      if (topmostOrExclusiveWidget.value.wmZorder === 'exclusive') {
        if (!AppConfig().overlayBackgroundExclusive) {
          return undefined
        }
      }
      return AppConfig().overlayBackground
    })

    function isVisible (wmId: Widget['wmId']): boolean {
      return visibilityState.value
        .find(_ => _.wmId === wmId)!
        .isVisible
    }

    return {
      overlayBackground,
      widgets: computed(() => AppConfig().widgets),
      handleBackgroundClick,
      isVisible
    }
  }
})
</script>
