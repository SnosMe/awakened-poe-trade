<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4"
    style="min-width: 20rem; max-width: min(100vw - var(--game-panel), 30rem);">
    <div class="bg-gray-900 py-1 px-8 flex items-baseline gap-2">
      <div class="flex-1 text-center">{{ mapName }}</div>
      <div class="ml-8 text-gray-400">{{ t('map_check.profile') }}</div>
      <div class="flex gap-0.5">
        <button
          v-for="profile in profiles" :key="profile.text"
          @click="profile.select"
          :class="{ 'border border-gray-600': profile.active }"
          class="w-6 bg-gray-800"
        >{{ profile.text }}</button>
      </div>
    </div>
    <FullscreenImage v-if="image"
      :class="$style.screenshot" :src="image" />
    <div :class="$style.body">
      <div v-if="item.mapArea && MEMORY_MAPS.includes(item.mapArea.refName)"
        :class="$style.mavenReminder">
        <img src="/images/maven-witness.png" class="w-8">
        <span>{{ t('map_check.maven_reminder') }}</span>
      </div>
      <div v-if="!mapStats.length" class="px-8">
        {{ t('map_check.no_mods') }}
      </div>
      <div v-else class="flex flex-col">
        <MapStatButton v-for="stat in mapStats" :key="stat.matcher"
          :stat="stat" :config="config" />
        <div v-for="stat of unknownModifiers" :key="stat.type + '/' + stat.text"
          class="py-1 px-8">
          <span class="text-orange-400">{{ t('Not recognized modifier') }} &mdash;</span> {{ stat.text }}
        </div>
      </div>
    </div>
    <div v-if="hasOutdatedTranslation"
      class="py-2 px-8 bg-gray-700">{{ t('map_check.has_outdated') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ParsedItem } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { prepareMapStat } from './prepare-map-stats'
import { type MapCheckConfig, isOutdated } from './common.js'

import MapStatButton from './MapStatButton.vue'
import FullscreenImage from '@/web/ui/FullscreenImage.vue'

const props = defineProps<{
  item: ParsedItem,
  config: MapCheckConfig
}>()

const { t } = useI18n()

const MEMORY_MAPS = [
  'Courtyard of Wasting',
  'Chambers of Impurity',
  'Theatre of Lies'
]

const hasOutdatedTranslation = computed<boolean>(() => {
  const { profile } = props.config
  return props.config.selectedStats
    .some(entry => isOutdated(profile, entry))
})

const mapName = computed(() => {
  const { item } = props
  if (item.info.area?.blighted) {
    return item.info.name
  }
  return item.mapArea?.name ?? item.info.name
})

const image = computed(() => {
  const { item } = props
  if (
    (item.rarity === ItemRarity.Unique && item.isUnidentified) ||
    item.info.area?.blighted
  ) return

  return item.info.area?.screenshot ??
    item.mapArea?.area?.screenshot
})

const mapStats = computed(() => props.item.statsByType
  .filter(calc => calc.type === ModifierType.Explicit)
  .map(calc => prepareMapStat(calc)))

const unknownModifiers = computed(() => props.item.unknownModifiers
  .filter(mod => mod.type === ModifierType.Explicit))

const profiles = computed(() => {
  const ROMAN_NUMERALS = ['I', 'II', 'III']
  return ROMAN_NUMERALS.map((text, i) => ({
    text,
    active: (props.config.profile === i + 1),
    select: () => { props.config.profile = i + 1 }
  }))
})
</script>

<style lang="postcss" module>
.screenshot {
  aspect-ratio: 21 / 9;
  background: theme('colors.gray.700');
  position: relative;
  border: 1px solid black;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgb(255 255 255 / 0.08);
    border: 1px outset rgb(255 255 255 / 0.18);
    border-top-width: 2px;
    border-left-width: 2px;
    pointer-events: none;
  }
}

.screenshot + .body {
  border-top: theme('borderWidth.4') solid theme('colors.gray.900');
}

.body {
  display: flex;
  flex-direction: column;
  gap: theme('spacing.1');
  padding: theme('spacing.2') 0;
}

.mavenReminder {
  display: flex;
  align-items: center;
  gap: theme('spacing.2');
  padding: 0 theme('spacing.8');
  white-space: pre-wrap;
  font-style: italic;
  color: theme('colors.gray.500');
  line-height: 1.25;
}
</style>
