<template>
  <div
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
    class="flex-grow flex h-full pointer-events-none" :class="{
    'flex-row': clickPosition === 'stash',
    'flex-row-reverse': clickPosition === 'inventory',
  }">
    <div v-if="!isBrowserShown" class="layout-column flex-shrink-0"
      :style="{ width: `${poeUiWidth}px` }">
    </div>
    <div id="price-window" class="layout-column flex-shrink-0 text-gray-200 pointer-events-auto" style="width: 28.75rem;">
      <app-titlebar @close="closePriceCheck" :title="title">
        <div class="flex">
          <ui-popover v-if="exaltedCost" trigger="click" boundary="#price-window">
            <template #target>
              <button class="titlebar-btn">
                <i class="fas fa-exchange-alt mt-px"></i> {{ exaltedCost }}
              </button>
            </template>
            <template #content>
              <item-quick-price
                :min="exaltedCost"
                :max="exaltedCost"
                :item-img="require('@/assets/images/exa.png').default"
                currency="chaos"
              />
              <div v-for="i in 9" :key="i">
                <div class="pl-1">{{ i / 10 }} exa ⇒ {{ Math.round(exaltedCost * i / 10) }} c</div>
              </div>
            </template>
          </ui-popover>
        </div>
      </app-titlebar>
      <div class="flex-grow layout-column min-h-0 bg-gray-800">
        <div id="home" class="flex-grow layout-column">
          <div class="flex-1"></div>
          <div class="flex-grow layout-column">
            <background-info />
            <check-position-circle v-if="showCheckPos"
              :position="checkPosition" style="z-index: -1;" />
            <unidentified-resolver :item="item" @identify="item = $event" />
            <checked-item v-if="isLeagueSelected && item"
              :item="item" :advanced-check="advancedCheck" />
            <div v-if="isBrowserShown" class="bg-gray-900 px-6 py-2 truncate">
              <i18n-t keypath="Press {0} to switch between browser and game." tag="div">
                <span class="bg-gray-400 text-gray-900 rounded px-1">{{ overlayKey }}</span>
              </i18n-t>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="layout-column flex-1 min-w-0">
      <div class="flex" :class="{
        'flex-row': clickPosition === 'stash',
        'flex-row-reverse': clickPosition === 'inventory'
      }">
        <related-items :item="item" class="pointer-events-auto" />
        <rate-limiter-state class="pointer-events-auto" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, provide, shallowRef, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import CheckedItem from './CheckedItem.vue'
import BackgroundInfo from './BackgroundInfo.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { IpcPriceCheck, PRICE_CHECK, PRICE_CHECK_CANCELED } from '@/ipc/ipc-event'
import { chaosExaRate } from '../background/Prices'
import { selected as league } from '@/web/background/Leagues'
import { Config } from '@/web/Config'
import { parseClipboard, ParsedItem } from '@/parser'
import RelatedItems from './related-items/RelatedItems.vue'
import RateLimiterState from './trade/RateLimiterState.vue'
import UnidentifiedResolver from './unidentified-resolver/UnidentifiedResolver.vue'
import CheckPositionCircle from './CheckPositionCircle.vue'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { PriceCheckWidget, WidgetManager } from '../overlay/interfaces'

export default defineComponent({
  components: {
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

    nextTick(() => {
      props.config.wmWants = 'hide'
      props.config.wmFlags = ['hide-on-blur', 'skip-menu']
    })

    const item = shallowRef<ParsedItem | null>(null)
    const advancedCheck = shallowRef(false)
    const checkPosition = shallowRef({ x: 1, y: 1 })

    MainProcess.addEventListener(PRICE_CHECK, (e) => {
      const _e = (e as CustomEvent<IpcPriceCheck>).detail
      wm.closeBrowser(props.config.wmId)
      wm.show(props.config.wmId)
      checkPosition.value = {
        x: _e.position.x - window.screenX,
        y: _e.position.y - window.screenY
      }
      item.value = parseClipboard(_e.clipboard)
      advancedCheck.value = _e.lockedMode
    })
    MainProcess.addEventListener(PRICE_CHECK_CANCELED, () => {
      wm.hide(props.config.wmId)
    })

    watch(() => props.config.wmWants, (state) => {
      if (state === 'hide') {
        MainProcess.priceCheckWidgetIsHidden()
      }
    })

    const title = computed(() => league.value || 'Awakened PoE Trade')
    const exaltedCost = computed(() => (chaosExaRate.value) ? Math.round(chaosExaRate.value) : null)
    const isBrowserShown = computed(() => props.config.wmFlags.includes('has-browser'))
    const overlayKey = computed(() => Config.store.overlayKey)
    const showCheckPos = computed(() => wm.active && Config.store.priceCheckShowCursor)
    const poeUiWidth = computed(() => wm.poeUiWidth)
    const isLeagueSelected = computed(() => Boolean(league.value))
    const clickPosition = computed(() => {
      if (isBrowserShown.value) {
        return 'inventory'
      } else {
        return checkPosition.value.x > (window.innerWidth / 2)
          ? 'inventory'
          : 'stash'
          // or {chat, vendor, center of screen}
      }
    })

    watch(isBrowserShown, (isShown) => {
      if (isShown) {
        wm.setFlag(props.config.wmId, 'hide-on-blur', false)
        wm.setFlag(props.config.wmId, 'hide-on-blur(close)', true)
        wm.setFlag(props.config.wmId, 'invisible-on-blur', true)
      } else {
        wm.setFlag(props.config.wmId, 'hide-on-blur(close)', false)
        wm.setFlag(props.config.wmId, 'invisible-on-blur', false)
        wm.setFlag(props.config.wmId, 'hide-on-blur', true)
      }
    })

    function closePriceCheck () {
      MainProcess.closeOverlay()
    }

    provide('widget', {
      config: computed(() => props.config)
    })

    const { t } = useI18n()

    return {
      t,
      clickPosition,
      isBrowserShown,
      poeUiWidth,
      closePriceCheck,
      title,
      exaltedCost,
      showCheckPos,
      checkPosition,
      item,
      advancedCheck,
      overlayKey,
      isLeagueSelected
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Press {0} to switch between browser and game.": "Нажмите {0} для перехода между браузером/игрой."
  }
}
</i18n>
