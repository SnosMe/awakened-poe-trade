<template>
  <button :class="[$style.button, { [$style.limited]: isLimited }]"
    @click="showRateLimitState = !showRateLimitState" v-bind="$attrs">Rate limiting</button>
  <div v-if="showRateLimitState"
    class="font-sans p-4 bg-gray-800 text-gray-400 mb-8 border border-gray-900 absolute bottom-0"
    style="border-width: 0.25rem;" v-bind="$attrs">
    <div v-for="limit in limits" :key="limit.policy">
      <div :class="{ 'text-red-400': limit.hasQueue }">Policy: {{ limit.policy }}</div>
      <div>
        <div v-for="(rule, idx) in limit.rules" :key="idx">
          <span>{{ rule.active }} / {{ rule.max }} over {{ rule.window }}s</span>
          <span v-if="rule.queue" class="pl-1">(queue: {{ rule.queue }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, inject } from 'vue'
import { RATE_LIMIT_RULES } from './common'
import { PriceCheckWidget } from '@/web/overlay/interfaces'

export default defineComponent({
  inheritAttrs: false,
  setup () {
    const widget = inject<{ config: ComputedRef<PriceCheckWidget> }>('widget')!

    const limits = computed(() => {
      const LIMITS = [
        { policy: 'trade-search-request-limit', rules: RATE_LIMIT_RULES.SEARCH },
        { policy: 'trade-exchange-request-limit', rules: RATE_LIMIT_RULES.EXCHANGE },
        { policy: 'trade-fetch-request-limit', rules: RATE_LIMIT_RULES.FETCH }
      ]

      return LIMITS.map((limit) => ({
        policy: limit.policy,
        hasQueue: Array.from(limit.rules).some(rl => rl.queue.value),
        rules: Array.from(limit.rules).map(rl => ({
          max: rl.max,
          window: rl.window,
          active: rl.stack.length,
          queue: rl.queue.value
        }))
      }))
    })

    const isLimited = computed(() => limits.value.some(limit => limit.hasQueue))

    const showRateLimitState = computed<boolean>({
      get () {
        return widget.config.value.showRateLimitState
      },
      set (value) {
        widget.config.value.showRateLimitState = value
      }
    })

    return {
      limits,
      showRateLimitState,
      isLimited
    }
  }
})
</script>

<style lang="postcss" module>
.button {
  @apply mx-6 px-4;
  @apply bg-gray-900 text-gray-600;
  @apply rounded-t;
  @apply leading-6;
  position: absolute;
  bottom: 0;
}

.limited {
  @apply bg-red-700 text-red-200;

  /* Animate.css */
  :global {
    animation: shakeX;
    animation-duration: 1s;
  }
}
</style>
