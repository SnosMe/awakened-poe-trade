<template>
  <tr
    ref="target"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <td class="px-2 whitespace-nowrap">
      <span :class="{ 'line-through': result.priceCurrency === 'exalted' }">{{ result.priceAmount }} {{ result.priceCurrency }}</span>
      <span v-if="result.listedTimes > 2" class="rounded px-1 text-gray-800 bg-gray-400 ml-1 -mr-2"><span class="font-sans">×</span> {{ result.listedTimes }}</span>
      <span v-else-if="!result.hasFee" :class="$style.stashListing">
        <img :class="$style.stashIcon" src="/images/stash.png">
        <i v-if="!result.hasNote" class="fas fa-question" />
      </span>
    </td>
    <td v-if="showStock" class="px-2 text-right">{{ result.stackSize }}</td>
    <td v-if="showItemLevel" class="px-2 whitespace-nowrap text-right">{{ result.itemLevel }}</td>
    <td v-if="showGemLevel" class="pl-2 whitespace-nowrap">{{ result.level }}</td>
    <td v-if="showQuality" class="px-2 whitespace-nowrap text-blue-400 text-right">{{ result.quality }}</td>
    <td class="pr-2 pl-4 whitespace-nowrap">
      <div class="inline-flex items-center">
        <div :class="[$style.accountStatus, $style[result.accountStatus]]" />
        <div class="ml-1 font-sans text-xs">{{ result.relativeDate }}</div>
      </div>
      <span v-if="!showSeller && result.isMine" class="rounded px-1 text-gray-800 bg-gray-400 ml-1">{{ t('You') }}</span>
    </td>
    <td v-if="showSeller" class="px-2 whitespace-nowrap">
      <span v-if="result.isMine" class="rounded px-1 text-gray-800 bg-gray-400">{{ t('You') }}</span>
      <span v-else class="font-sans text-xs">{{ showSeller === 'ign' ? result.ign : result.accountName }}</span>
    </td>
  </tr>
  <Teleport to="body">
    <div ref="content">
      <tooltip-item v-if="isTooltipMounted" :result="result" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import tippy from 'tippy.js'
import type { Instance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { useI18nNs } from '@/web/i18n'
import { AppConfig } from '@/web/Config'
import type { PriceCheckWidget } from '@/web/overlay/widgets'
import type { PricingResult } from './pathofexile-trade'
import TooltipItem from './TooltipItem.vue'

const props = defineProps<{
  result: PricingResult & { listedTimes: number }
  showStock: boolean
  showItemLevel: boolean
  showGemLevel: boolean
  showQuality: boolean
  showSeller: PriceCheckWidget['showSeller']
}>()

const { t } = useI18nNs('trade_result')
const target = ref<HTMLElement>()
const content = ref<HTMLElement>()
const isTooltipMounted = ref(false)
const tooltipMode = computed(() => AppConfig<PriceCheckWidget>('price-check')!.itemHoverTooltip)
let instance: Instance | undefined
let stopModeWatch: (() => void) | undefined

function handleKeyDown (event: KeyboardEvent) {
  if (event.key !== 'Shift') return
  instance?.enable()
  if (target.value?.matches(':hover')) {
    isTooltipMounted.value = true
    instance?.show()
  }
}

function handleMouseEnter () {
  if (tooltipMode.value !== 'off' && props.result.displayItem) {
    isTooltipMounted.value = true
  }
}

function handleMouseLeave () {
  if (!instance?.state.isVisible) {
    isTooltipMounted.value = false
  }
}

function releaseShift () {
  if (tooltipMode.value !== 'keybind') return
  instance?.hide()
  instance?.disable()
}

function handleKeyUp (event: KeyboardEvent) {
  if (event.key === 'Shift') releaseShift()
}

function removeKeyListeners () {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('blur', releaseShift)
}

function destroyTooltip () {
  removeKeyListeners()
  instance?.destroy()
  instance = undefined
  isTooltipMounted.value = false
}

function configureTooltip (mode: PriceCheckWidget['itemHoverTooltip']) {
  destroyTooltip()
  if (mode === 'off' || !props.result.displayItem || !target.value || !content.value) return

  instance = tippy(target.value, {
    content: content.value,
    interactive: true,
    theme: 'item-tooltip',
    trigger: 'mouseenter',
    placement: 'left',
    arrow: true,
    delay: [0, 0],
    animation: false,
    maxWidth: 'none',
    onHidden: () => { isTooltipMounted.value = false }
  })

  if (mode === 'keybind') {
    instance.disable()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', releaseShift)
  }
}

onMounted(() => {
  stopModeWatch = watch(tooltipMode, configureTooltip, { immediate: true })
})

onBeforeUnmount(() => {
  stopModeWatch?.()
  destroyTooltip()
})
</script>

<style lang="postcss" module>
.accountStatus {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  &.offline { @apply bg-red-600; }
  &.afk { @apply bg-orange-500; }
}

.stashListing {
  position: relative;
  display: inline-block;
  @apply ml-1 -mr-1;

  & > i {
    position: absolute;
    line-height: inherit;
    left: 0;
    right: 0;
    text-align: center;
    text-shadow: 1px 1px 1px black;
  }
}

.stashIcon {
  filter: grayscale(1) opacity(0.5);
  display: inline-block;
  max-width: none;
  height: 1.25rem;
  vertical-align: bottom;
}
</style>

<style lang="postcss">
.tippy-box[data-theme~="item-tooltip"] {
  @apply w-fit h-fit shadow-none bg-transparent;
}

div[data-tippy-root] .tippy-box[data-theme~="item-tooltip"] {
  @apply bg-transparent;
}

.tippy-box[data-theme~="item-tooltip"] .tippy-content {
  @apply p-0 w-fit h-fit;
}

.tippy-box[data-theme~="item-tooltip"] > .tippy-arrow::before {
  @apply text-white;
}
</style>
