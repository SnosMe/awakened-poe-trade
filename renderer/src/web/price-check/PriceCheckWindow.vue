<template>
  <div
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
    class="flex grow h-full pointer-events-none" :class="{
    'flex-row': clickPosition === 'stash',
    'flex-row-reverse': clickPosition === 'inventory',
  }">
    <div v-if="!isBrowserShown" class="layout-column shrink-0"
      style="width: var(--game-panel);">
    </div>
    <div id="price-window" class="layout-column shrink-0 text-gray-200 pointer-events-auto" style="width: 28.75rem;">
      <AppTitleBar @close="closePriceCheck" @click="openLeagueSelection" :title="title">
        <ui-popover v-if="stableOrbCost" trigger="click" boundary="#price-window">
          <template #target>
            <button><i class="fas fa-exchange-alt" /> {{ stableOrbCost }}</button>
          </template>
          <template #content>
            <item-quick-price class="text-base"
              :price="{ min: stableOrbCost, max: stableOrbCost, currency: 'chaos' }"
              item-img="/images/divine.png"
            />
            <div v-for="i in 9" :key="i">
              <div class="pl-1">{{ i / 10 }} div ⇒ {{ Math.round(stableOrbCost * i / 10) }} c</div>
            </div>
          </template>
        </ui-popover>
        <i v-else-if="xchgRateLoading()" class="fas fa-dna fa-spin px-2" />
        <div v-else class="w-8" />
      </AppTitleBar>
      <div class="grow layout-column min-h-0 bg-gray-800">
        <background-info />
        <check-position-circle v-if="showCheckPos"
          :position="checkPosition" style="z-index: -1;" />
        <template v-if="item?.isErr()">
          <ui-error-box class="m-4">
            <template #name>{{ t(item.error.name) }}</template>
            <p>{{ t(item.error.message) }}</p>
          </ui-error-box>
          <pre class="bg-gray-900 rounded m-4 overflow-x-hidden p-2">{{ item.error.rawText }}</pre>
        </template>
        <template v-else-if="item?.isOk()">
          <unidentified-resolver :item="item.value" @identify="handleIdentification($event)" />
          <checked-item v-if="isLeagueSelected"
            :item="item.value" :advanced-check="advancedCheck" />
        </template>
        <div v-if="isBrowserShown" class="bg-gray-900 px-6 py-2 truncate">
          <i18n-t keypath="app.toggle_browser_hint" tag="div">
            <span class="bg-gray-400 text-gray-900 rounded px-1">{{ overlayKey }}</span>
          </i18n-t>
        </div>
      </div>
    </div>
    <webview v-if="isBrowserShown" ref="iframeEl"
      class="pointer-events-auto flex-1"
      width="100%" height="100%" />
    <div v-else class="layout-column flex-1 min-w-0">
      <div class="flex" :class="{
        'flex-row': clickPosition === 'stash',
        'flex-row-reverse': clickPosition === 'inventory'
      }">
        <related-items v-if="item?.isOk()" class="pointer-events-auto"
          :item="item.value" :click-position="clickPosition" />
        <rate-limiter-state class="pointer-events-auto" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, shallowRef, watch, computed, nextTick, provide } from 'vue'
import { Result, ok, err } from 'neverthrow'
import { useI18n } from 'vue-i18n'
import CheckedItem from './CheckedItem.vue'
import BackgroundInfo from './BackgroundInfo.vue'
import { MainProcess, Host } from '@/web/background/IPC'
import { usePoeninja } from '../background/Prices'
import { useLeagues } from '@/web/background/Leagues'
import { AppConfig } from '@/web/Config'
import { ItemCategory, ItemRarity, parseClipboard, ParsedItem } from '@/parser'
import RelatedItems from './related-items/RelatedItems.vue'
import RateLimiterState from './trade/RateLimiterState.vue'
import UnidentifiedResolver from './unidentified-resolver/UnidentifiedResolver.vue'
import CheckPositionCircle from './CheckPositionCircle.vue'
import AppTitleBar from '@/web/ui/AppTitlebar.vue'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { PriceCheckWidget, WidgetManager } from '../overlay/interfaces'

type ParseError = { name: string; message: string; rawText: ParsedItem['rawText'] }

export default defineComponent({
  components: {
    AppTitleBar,
    CheckedItem,
    UnidentifiedResolver,
    BackgroundInfo,
    RelatedItems,
    RateLimiterState,
    CheckPositionCircle,
    ItemQuickPrice
  },
  props: {
    config: {
      type: Object as PropType<PriceCheckWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { xchgRate, initialLoading: xchgRateLoading, queuePricesFetch } = usePoeninja()

    nextTick(() => {
      props.config.wmWants = 'hide'
      props.config.wmFlags = ['hide-on-blur', 'skip-menu']
    })

    const item = shallowRef<null | Result<ParsedItem, ParseError>>(null)
    const advancedCheck = shallowRef(false)
    const checkPosition = shallowRef({ x: 1, y: 1 })

    MainProcess.onEvent('MAIN->CLIENT::item-text', (e) => {
      if (e.target !== 'price-check') return

      if (Host.isElectron && !e.focusOverlay) {
        // everything in CSS pixels
        const width = 28.75 * AppConfig().fontSize
        const screenX = ((e.position.x - window.screenX) > window.innerWidth / 2)
          ? (window.screenX + window.innerWidth) - wm.poePanelWidth.value - width
          : window.screenX + wm.poePanelWidth.value
        MainProcess.sendEvent({
          name: 'OVERLAY->MAIN::track-area',
          payload: {
            holdKey: props.config.hotkeyHold,
            closeThreshold: 2.5 * AppConfig().fontSize,
            from: e.position,
            area: {
              x: screenX,
              y: window.screenY,
              width,
              height: window.innerHeight
            },
            dpr: window.devicePixelRatio
          }
        })
      }
      closeBrowser()
      wm.show(props.config.wmId)
      checkPosition.value = e.position
      advancedCheck.value = e.focusOverlay

      item.value = (e.item ? ok(e.item as ParsedItem) : parseClipboard(e.clipboard))
        .andThen(item => (
          (item.category === ItemCategory.HeistContract && item.rarity !== ItemRarity.Unique) ||
          (item.category === ItemCategory.Sentinel && item.rarity !== ItemRarity.Unique))
          ? err('item.unknown')
          : ok(item))
        .mapErr(err => ({
          name: `${err}`,
          message: `${err}_help`,
          rawText: e.clipboard
        }))

      if (item.value.isOk()) {
        queuePricesFetch()
      }
    })

    function handleIdentification (identified: ParsedItem) {
      item.value = ok(identified)
    }

    MainProcess.onEvent('MAIN->OVERLAY::hide-exclusive-widget', () => {
      wm.hide(props.config.wmId)
    })

    watch(() => props.config.wmWants, (state) => {
      if (state === 'hide') {
        closeBrowser()
      }
    })

    const leagues = useLeagues()
    const title = computed(() => leagues.selectedId.value || 'Awakened PoE Trade')
    const stableOrbCost = computed(() => (xchgRate.value) ? Math.round(xchgRate.value) : null)
    const isBrowserShown = computed(() => props.config.wmFlags.includes('has-browser'))
    const overlayKey = computed(() => AppConfig().overlayKey)
    const showCheckPos = computed(() => wm.active.value && props.config.showCursor)
    const isLeagueSelected = computed(() => Boolean(leagues.selectedId.value))
    const clickPosition = computed(() => {
      if (isBrowserShown.value) {
        return 'inventory'
      } else {
        return checkPosition.value.x > (window.screenX + window.innerWidth / 2)
          ? 'inventory'
          : 'stash'
          // or {chat, vendor, center of screen}
      }
    })

    watch(isBrowserShown, (isShown) => {
      if (isShown) {
        wm.setFlag(props.config.wmId, 'hide-on-blur', false)
        wm.setFlag(props.config.wmId, 'invisible-on-blur', true)
      } else {
        wm.setFlag(props.config.wmId, 'invisible-on-blur', false)
        wm.setFlag(props.config.wmId, 'hide-on-blur', true)
      }
    })

    function closePriceCheck () {
      if (isBrowserShown.value || !Host.isElectron) {
        wm.hide(props.config.wmId)
      } else {
        Host.sendEvent({ name: 'OVERLAY->MAIN::focus-game', payload: undefined })
      }
    }

    function openLeagueSelection () {
      const settings = wm.widgets.value.find(w => w.wmType === 'settings')!
      wm.setFlag(settings.wmId, `settings:widget:${props.config.wmId}`, true)
      wm.show(settings.wmId)
    }

    const iframeEl = shallowRef<HTMLIFrameElement | null>(null)

    function showBrowser (url: string) {
      wm.setFlag(props.config.wmId, 'has-browser', true)
      nextTick(() => {
        iframeEl.value!.src = url
      })
    }

    function closeBrowser () {
      wm.setFlag(props.config.wmId, 'has-browser', false)
    }

    provide<(url: string) => void>('builtin-browser', showBrowser)

    const { t } = useI18n()

    return {
      t,
      clickPosition,
      isBrowserShown,
      iframeEl,
      closePriceCheck,
      title,
      stableOrbCost,
      xchgRateLoading,
      showCheckPos,
      checkPosition,
      item,
      advancedCheck,
      handleIdentification,
      overlayKey,
      isLeagueSelected,
      openLeagueSelection
    }
  }
})
</script>
