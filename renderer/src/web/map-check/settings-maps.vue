<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="flex p-1">
      <input :placeholder="t('Search') + '...'" v-model="search" class="bg-gray-900 rounded px-1">
      <UiToggle v-model="onlySelected" class="mx-2">{{ t(':search_selected') }}</UiToggle>
      <UiToggle v-model="showNewStats" class="ml-12">{{ t(':new_mods_icon') }}</UiToggle>
    </div>
    <div class="flex items-baseline py-1 shadow">
      <div class="flex-1 px-2 leading-none">{{ t(':search_stat_col', [filteredStats.length]) }}</div>
      <div class="flex gap-x-1 text-center items-center" style="padding-right: calc(0.875rem + 2.350rem);">
        <i class="w-8 py-1 bg-orange-600 fas fa-exclamation-triangle"></i>
        <i class="w-8 py-1 bg-red-700 fas fa-skull-crossbones"></i>
        <i class="w-8 py-1 bg-green-700 fas fa-check"></i>
      </div>
    </div>
    <VirtualScroll
      class="flex-1"
      style="overflow-y: scroll;"
      :items="filteredStats"
      :item-height="2 * fontSize"
      v-slot="props"
    >
      <SettingsMatcherEntry
        :style="{ position: 'absolute', top: `${props.top}px` }"
        :matcher="props.item"
        :selected-stats="selectedStats"
        :profile="profile" />
    </VirtualScroll>
  </div>
</template>

<script lang="ts">
import { STATS_ITERATOR } from '@/assets/data'
import { StatMatcher, StatTag, decisionHasColor, isOutdated } from './common.js'

export default {
  name: 'map_check.name'
}

function tagToShowOrder (tag?: StatTag): number {
  switch (tag) {
    case StatTag.UberMapExclusive: return 1
    case StatTag.HeistExclusive: return 2
  }
  return 0
}

function findAllAreaMods (): StatMatcher[] {
  const out: StatMatcher[] = []
  for (const stat of STATS_ITERATOR('AreaMods')) {
    if (!stat.fromAreaMods && !stat.fromUberAreaMods && !stat.fromHeistAreaMods) continue

    const tag = (stat.fromHeistAreaMods && !stat.fromAreaMods) ? StatTag.HeistExclusive
      : (stat.fromUberAreaMods && !stat.fromAreaMods) ? StatTag.UberMapExclusive : undefined

    for (const c of stat.matchers) {
      out.push({ matchStr: c.string, tag })
    }
  }
  out.sort((a, b) =>
    (tagToShowOrder(a.tag) - tagToShowOrder(b.tag)) ||
    a.matchStr.localeCompare(b.matchStr))
  return out
}
</script>

<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
import { useI18nNs } from '@/web/i18n'
import { configProp, findWidget, configModelValue } from '../settings/utils'
import type { ItemCheckWidget } from '../item-check/widget.js'

import UiToggle from '@/web/ui/UiToggle.vue'
import VirtualScroll from '@/web/ui/VirtualScroll.vue'
import SettingsMatcherEntry from './SettingsMatcherEntry.vue'

const props = defineProps(configProp())

const widget = computed(() => findWidget<ItemCheckWidget>('item-check', props.config)!)

const selectedProfileMatchers = computed(() => {
  const { profile } = widget.value.maps
  const matchers = new Set<string>()
  for (const entry of widget.value.maps.selectedStats) {
    if (decisionHasColor(entry.decision, profile)) {
      matchers.add(entry.matcher)
    }
  }
  return matchers
})

const outdatedTranslationList = computed<StatMatcher[]>(() => {
  const { profile } = widget.value.maps
  return widget.value.maps.selectedStats
    .filter(entry => isOutdated(profile, entry))
    .map(entry => ({ matchStr: entry.matcher, tag: StatTag.Outdated }))
})

const areaStatsDb = computed(() => findAllAreaMods())
const search = ref('')
const onlySelected = ref(false)
const filteredStats = computed<StatMatcher[]>(() => {
  const q = search.value.toLowerCase().split(' ')

  const filtered = areaStatsDb.value
    .filter(stat => {
      const searchStr = stat.matchStr.toLowerCase()
      if (!q.every(part => searchStr.includes(part))) return false
      if (onlySelected.value) {
        return selectedProfileMatchers.value.has(stat.matchStr)
      }
      return true
    })

  return [
    ...outdatedTranslationList.value,
    ...filtered
  ]
})

const selectedStats = computed(() => widget.value.maps.selectedStats)
const profile = computed(() => widget.value.maps.profile)
const fontSize = computed(() => props.config.fontSize)
const showNewStats = configModelValue(() => widget.value.maps, 'showNewStats')
const { t } = useI18nNs('map_check')
</script>
