<template>
  <div class="flex">
    <button @click="handleClick"
      class="p-2 gap-x-2 leading-none text-left flex-1 flex items-center overflow-hidden"
      :class="btnStyle?.bg ?? 'hover:bg-gray-700'">
      <i class="fas text-center w-4 shrink-0"
        :class="btnStyle?.icon" />
      <ItemModifierText class="truncate"
        :text="stat.matcher" :roll="stat.roll" />
    </button>
    <button @click="toggleSeenStatus" class="flex leading-none items-center text-gray-600 w-8 text-center justify-center">
      <i v-if="showNewStatIcon" class="fas fa-eye-slash"></i>
    </button>
  </div>
</template>

<script lang="ts">
const BTN_STYLES = new Map([
  ['d', { bg: 'bg-red-700', icon: 'fa-skull-crossbones' }],
  ['w', { bg: 'bg-orange-600', icon: 'fa-exclamation-triangle' }],
  ['g', { bg: 'bg-green-700', icon: 'fa-check' }]
])
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { AppConfig } from '@/web/Config'
import { PreparedStat } from './prepare-map-stats'
import { ItemCheckWidget } from '../overlay/interfaces'

import ItemModifierText from '../ui/ItemModifierText.vue'

const props = defineProps<{
  stat: PreparedStat
}>()

const config = computed(() => AppConfig<ItemCheckWidget>('item-check')!.maps)
const entry = computed(() => config.value.selectedStats
  .find(({ matcher }) => matcher === props.stat.matcher))

const decision = computed<string>({
  get () {
    if (!entry.value) return '-'
    return entry.value.decision[config.value.profile - 1]
  },
  set (value) {
    if (!entry.value) {
      const decision = ['-', '-', '-']
      decision[config.value.profile - 1] = value
      config.value.selectedStats.push({
        matcher: props.stat.matcher,
        decision: decision.join('')
      })
    } else {
      const decision = entry.value.decision.split('')
      decision[config.value.profile - 1] = value
      entry.value.decision = decision.join('')
    }
  }
})

const showNewStatIcon = computed(() =>
  config.value.showNewStats && decision.value === '-')

function toggleSeenStatus () {
  if (config.value.showNewStats) {
    decision.value = (decision.value === '-') ? 's' : '-'
  }
}

const btnStyle = computed(() => BTN_STYLES.get(decision.value))

function handleClick () {
  switch (decision.value) {
    case '-': decision.value = 'd'; break
    case 's': decision.value = 'd'; break
    case 'd': decision.value = 'w'; break
    case 'w': decision.value = 'g'; break
    case 'g': decision.value = 's'; break
  }
}
</script>
