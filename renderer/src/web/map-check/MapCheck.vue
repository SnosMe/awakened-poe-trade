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
    <fullscreen-image v-if="image" :src="image" />
    <div v-if="!mapStats.length" class="px-8 py-2">
      {{ t('map_check.no_mods') }}
    </div>
    <div v-else class="py-2 flex flex-col">
      <map-stat-button v-for="stat in mapStats" :key="stat.matcher"
        :stat="stat" />
      <div v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
        class="py-1 px-8">
        <span class="text-orange-400">{{ t('Not recognized modifier') }} &mdash;</span> {{ stat.text }}
      </div>
    </div>
    <div v-if="hasOutdatedTranslation" class="py-2 px-8 bg-gray-700">{{ t('map_check.has_outdated') }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, ParsedItem } from '@/parser'
import MapStatButton from './MapStatButton.vue'
import { prepareMapStats } from './prepare-map-stats'
import { STAT_BY_MATCH_STR } from '@/assets/data'
import { ItemCheckWidget } from '../overlay/interfaces'
import { AppConfig } from '@/web/Config'

export default defineComponent({
  components: {
    MapStatButton
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const config = computed(() => AppConfig<ItemCheckWidget>('item-check')!.maps)

    const hasOutdatedTranslation = computed<boolean>(() => {
      const idx = config.value.profile - 1
      return config.value.selectedStats
        .some(entry =>
          entry.decision[idx] !== '-' &&
          entry.decision[idx] !== 's' &&
          STAT_BY_MATCH_STR(entry.matcher) == null)
    })

    return {
      t,
      mapName: computed(() => props.item.info.name),
      image: computed(() =>
        (props.item.rarity === ItemRarity.Unique && props.item.isUnidentified)
          ? undefined
          : props.item.info.map?.screenshot
      ),
      mapStats: computed(() => prepareMapStats(props.item)),
      hasOutdatedTranslation,
      profiles: computed(() => {
        const ROMAN_NUMERALS = ['I', 'II', 'III']
        return ROMAN_NUMERALS.map((text, i) => ({
          text,
          active: (config.value.profile === i + 1),
          select: () => { config.value.profile = i + 1 }
        }))
      })
    }
  }
})
</script>
