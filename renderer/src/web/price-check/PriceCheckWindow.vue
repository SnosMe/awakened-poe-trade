<template>
  <div
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute;"
    class="flex grow h-full pointer-events-none" :class="{
    'flex-row': clickPosition === 'stash',
    'flex-row-reverse': clickPosition === 'inventory',
  }">
    <div v-if="!isBrowserShown" class="layout-column shrink-0"
      :style="{ width: `${poeUiWidth}px` }">
    </div>
    <div id="price-window" class="layout-column shrink-0 text-gray-200 pointer-events-auto" style="width: 28.75rem;">
      <app-titlebar @close="closePriceCheck" @click="openLeagueSelection" :title="title">
        <div class="flex">
          <ui-popover v-if="stableOrbCost" trigger="click" boundary="#price-window">
            <template #target>
              <button><i class="fas fa-exchange-alt"></i> {{ stableOrbCost }}</button>
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
        </div>
      </app-titlebar>
      <div class="grow layout-column min-h-0 bg-gray-800">
        <background-info />
        <check-position-circle v-if="showCheckPos"
          :position="checkPosition" style="z-index: -1;" />
        <template v-if="item && ('error' in item)">
          <ui-error-box class="m-4">
            <template #name>{{ t(item.error.name) }}</template>
            <p>{{ t(item.error.message) }}</p>
          </ui-error-box>
          <pre class="bg-gray-900 rounded m-4 overflow-x-hidden p-2">{{ item.rawText }}</pre>
        </template>
        <template v-else>
          <unidentified-resolver :item="item" @identify="item = $event" />
          <checked-item v-if="isLeagueSelected && item"
            :item="item" :advanced-check="advancedCheck" />
        </template>
        <div v-if="isBrowserShown" class="bg-gray-900 px-6 py-2 truncate">
          <i18n-t keypath="Press {0} to switch between browser and game." tag="div">
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
        <related-items v-if="item && !('error' in item)" :item="item" class="pointer-events-auto" />
        <rate-limiter-state class="pointer-events-auto" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, shallowRef, watch, computed, nextTick, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import CheckedItem from './CheckedItem.vue'
import BackgroundInfo from './BackgroundInfo.vue'
import { MainProcess } from '@/web/background/IPC'
import { xchgRate } from '../background/Prices'
import { selected as league } from '@/web/background/Leagues'
import { AppConfig } from '@/web/Config'
import { ItemCategory, ItemRarity, parseClipboard, ParsedItem } from '@/parser'
import RelatedItems from './related-items/RelatedItems.vue'
import RateLimiterState from './trade/RateLimiterState.vue'
import UnidentifiedResolver from './unidentified-resolver/UnidentifiedResolver.vue'
import CheckPositionCircle from './CheckPositionCircle.vue'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { PriceCheckWidget, WidgetManager } from '../overlay/interfaces'

interface ParseError {
  error: {
    name: string
    message: string
  }
  rawText: ParsedItem['rawText']
}

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

    const item = shallowRef<ParsedItem | ParseError | null>(null)
    const advancedCheck = shallowRef(false)
    const checkPosition = shallowRef({ x: 1, y: 1 })

    MainProcess.onEvent('MAIN->OVERLAY::price-check', (e) => {
      closeBrowser()
      wm.show(props.config.wmId)
      checkPosition.value = {
        x: e.position.x - window.screenX,
        y: e.position.y - window.screenY
      }
      advancedCheck.value = e.lockedMode
      try {
        const parsed = parseClipboard(e.clipboard)
        if (parsed != null && (
          (parsed.category === ItemCategory.HeistContract && parsed.rarity !== ItemRarity.Unique) ||
          (parsed.category === ItemCategory.Sentinel && parsed.rarity !== ItemRarity.Unique)
        )) {
          throw new Error('UNKNOWN_ITEM')
        } else {
          item.value = parsed
        }
      } catch (err: unknown) {
        const strings = (err instanceof Error && err.message === 'UNKNOWN_ITEM')
          ? 'unknown_item'
          : 'parse_error'

        item.value = {
          error: { name: `${strings}`, message: `${strings}_msg` },
          rawText: e.clipboard
        }
      }
    })
    MainProcess.onEvent('MAIN->OVERLAY::price-check-canceled', () => {
      wm.hide(props.config.wmId)
    })

    watch(() => props.config.wmWants, (state) => {
      if (state === 'hide') {
        closeBrowser()
        MainProcess.sendEvent({
          name: 'OVERLAY->MAIN::price-check-hide',
          payload: undefined
        })
      }
    })

    const title = computed(() => league.value || 'Awakened PoE Trade')
    const stableOrbCost = computed(() => (xchgRate.value) ? Math.round(xchgRate.value) : null)
    const isBrowserShown = computed(() => props.config.wmFlags.includes('has-browser'))
    const overlayKey = computed(() => AppConfig().overlayKey)
    const showCheckPos = computed(() => wm.active.value && props.config.showCursor)
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
        wm.setFlag(props.config.wmId, 'invisible-on-blur', true)
      } else {
        wm.setFlag(props.config.wmId, 'invisible-on-blur', false)
        wm.setFlag(props.config.wmId, 'hide-on-blur', true)
      }
    })

    function closePriceCheck () {
      if (isBrowserShown.value) {
        wm.hide(props.config.wmId)
      } else {
        MainProcess.closeOverlay()
      }
    }

    function openLeagueSelection () {
      const settings = wm.widgets.value.find(w => w.wmType === 'settings')!
      wm.setFlag(settings.wmId, 'settings:price-check', true)
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
      poeUiWidth: wm.poePanelWidth,
      closePriceCheck,
      title,
      stableOrbCost,
      showCheckPos,
      checkPosition,
      item,
      advancedCheck,
      overlayKey,
      isLeagueSelected,
      openLeagueSelection
    }
  }
})
</script>

<i18n>
{
  "en": {
    "unknown_item": "Unknown Item",
    "unknown_item_msg": "If this Item was introduced in this League, it will likely be supported in the next app update.",
    "parse_error": "An error occurred while parsing the item",
    "parse_error_msg": "This is probably a bug and you can report it on GitHub."
  },
  "ru": {
    "unknown_item": "Неизвестный предмет",
    "unknown_item_msg": "Если это новый предмет в этой лиге, скорее всего, он будет добавлен в следующем обновлении.",
    "parse_error": "Произошла ошибка при парсинге предмета",
    "parse_error_msg": "Скорее всего, это ошибка, и вы можете сообщить о ней на GitHub.",
    "Press {0} to switch between browser and game.": "Нажмите {0} для перехода между браузером/игрой."
  },
  "zh_CN": {
    "unknown_item": "未知物品",
    "unknown_item_msg": "若此为赛季物品，或将在下一版本更新中支持。",
    "parse_error": "分析物品错误",
    "parse_error_msg": "有可能是一个BUG，请至GitHub提交错误。",
    "Press {0} to switch between browser and game.": "请按 {0} 在浏览器和游戏之间切换。"
  },
  "cmn-Hant": {
    "unknown_item": "未知物品",
    "unknown_item_msg": "若此為賽季物品，或將在下一版本更新中支持。",
    "parse_error": "分析物品錯誤",
    "parse_error_msg": "有可能是一個BUG，請至GitHub提交錯誤。",
    "Press {0} to switch between browser and game.": "請按 {0} 在瀏覽器和遊戲之間切換。"
  }
}
</i18n>
