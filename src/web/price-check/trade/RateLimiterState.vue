<template>
  <div v-if="show"
    class="font-sans p-4 bg-gray-800 text-gray-400 mt-6 border border-gray-900" style="border-width: 4px;">
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

<script>
import { RATE_LIMIT_RULES } from './common'
import { Config } from '@/web/Config'

export default {
  computed: {
    show () {
      return Config.store.logLevel === 'debug' ||
        this.limits.some(limit => limit.hasQueue)
    },
    limits () {
      const LIMITS = [
        { policy: 'trade-search-request-limit', rules: RATE_LIMIT_RULES.SEARCH },
        { policy: 'trade-fetch-request-limit', rules: RATE_LIMIT_RULES.FETCH }
      ]

      return LIMITS.map((limit) => ({
        policy: limit.policy,
        hasQueue: limit.rules.some(rl => rl.state.queue),
        rules: limit.rules.map(rl => ({
          max: rl.max,
          window: rl.window,
          active: rl.state.stack.length,
          queue: rl.state.queue
        }))
      }))
    }
  }
}
</script>
