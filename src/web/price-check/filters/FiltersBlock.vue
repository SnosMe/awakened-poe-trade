<template>
  <div>
    <div class="flex flex-wrap items-center pb-3 gap-2">
      <button v-if="filters.linkedSockets" class="trade-tag" :class="{ disabled: filters.linkedSockets.disabled }"
        @click="filters.linkedSockets.disabled = !filters.linkedSockets.disabled">{{ t('Links: {0}', [filters.linkedSockets.value]) }}</button>
      <div v-if="filters.mapTier" class="trade-tag">{{ t('Map Tier: {0}', [filters.mapTier.value]) }}</div>
      <div v-if="filters.areaLevel" class="trade-tag">{{ t('Area Level: {0}', [filters.areaLevel.value]) }}</div>
      <div v-if="filters.heistWingsRevealed" class="trade-tag">{{ t('Wings Revealed: {0}', [filters.heistWingsRevealed.value]) }}</div>
      <div v-if="filters.mapBlighted" class="trade-tag">{{ t(filters.mapBlighted.value) }}</div>
      <div v-if="filters.discriminator" class="trade-tag">{{ t(filters.discriminator.value) }}</div>
      <filter-numeric-editable :filter="filters.itemLevel" name="Item Level:" />
      <filter-numeric-editable :filter="filters.stackSize" name="Stock:" />
      <button v-if="filters.whiteSockets" class="trade-tag" :class="{ disabled: filters.whiteSockets.disabled }"
        @click="filters.whiteSockets.disabled = !filters.whiteSockets.disabled">{{ t('White: {0}', [filters.whiteSockets.value]) }}</button>
      <button v-if="filters.gemLevel" class="trade-tag" :class="{ disabled: filters.gemLevel.disabled }"
        @click="filters.gemLevel.disabled = !filters.gemLevel.disabled">{{ t('Level: {0}', [filters.gemLevel.min]) }}</button>
      <button v-if="filters.quality" class="trade-tag" :class="{ disabled: filters.quality.disabled }"
        @click="filters.quality.disabled = !filters.quality.disabled">{{ t('Quality: {0}%', [filters.quality.value]) }}</button>
      <button v-if="filters.altQuality" class="trade-tag" :class="{ disabled: filters.altQuality.disabled }"
        @click="filters.altQuality.disabled = !filters.altQuality.disabled">{{ t(filters.altQuality.value) }}</button>
      <template v-if="filters.influences">
        <button v-for="influence of filters.influences" :key="influence.value" class="trade-tag flex items-center"
          :class="{ disabled: influence.disabled }"
          @click="influence.disabled = !influence.disabled"
        >
          <img class="w-5 h-5 -m-1" :src="`/images/influence-${influence.value}.png`">
          <span class="ml-2">{{ t(influence.value) }}</span>
        </button>
      </template>
      <button v-if="filters.unidentified" class="trade-tag" :class="{ disabled: filters.unidentified.disabled }"
        @click="filters.unidentified.disabled = !filters.unidentified.disabled">{{ t('Unidentified') }}</button>
      <button v-if="filters.veiled" class="trade-tag" :class="{ disabled: filters.veiled.disabled }"
        @click="filters.veiled.disabled = !filters.veiled.disabled">{{ t('Veiled') }}</button>
      <button v-if="filters.mirrored" class="trade-tag"
        @click="filters.mirrored.value = !filters.mirrored.value">{{ t(filters.mirrored.value ? 'Mirrored' : 'Not Mirrored') }}</button>
      <button v-if="stats.length" class="trade-tag" :class="{ disabled: totalSelectedMods === 0 }" @click="toggleStatsBlock">
        <span v-if="totalSelectedMods === 0">{{ t('Stats ignored') }}</span>
        <span v-else>{{ t('{0} of {1}, stats', [totalSelectedMods, stats.length]) }}</span>
        <i v-if="!showStatsBlock" class="fas fa-chevron-down pl-2 text-xs text-gray-400"></i>
      </button>
    </div>
    <div v-if="showStatsBlock && stats.length" class="my-4">
      <form @submit.prevent="handleStatsSubmit">
        <filter-modifier v-for="filter of shownStats" :key="filter.tag + '/' + filter.text"
          :filter="filter"
          :item="item"
          :show-sources="showFilterSources"
          @submit="handleStatsSubmit" />
        <unknown-modifier v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
          :stat="stat" />
        <input type="submit" class="hidden" />
      </form>
      <div class="flex gap-x-4">
        <button @click="toggleStatsBlock" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ t('Collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <ui-toggle v-if="shownStats.length != stats.length"
          v-model="showHidden" class="text-gray-400 pt-2">{{ t('Hidden') }}</ui-toggle>
        <!-- <ui-toggle
          v-model="showFilterSources" class="ml-auto text-gray-400 pt-2">{{ t('Mods') }}</ui-toggle> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterModifier from './FilterModifier.vue'
import FilterNumericEditable from './FilterNumericEditable.vue'
import UnknownModifier from './UnknownModifier.vue'
import { ItemFilters, StatFilter } from './interfaces'
import { ParsedItem } from '@/parser'

export default defineComponent({
  name: 'FiltersBlock',
  emits: ['submit'],
  components: {
    FilterModifier,
    FilterNumericEditable,
    UnknownModifier
  },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props, ctx) {
    const showStatsBlock = ref(true)
    const showHidden = ref(false)
    const showFilterSources = ref(false)

    watch(() => props.item, () => {
      showHidden.value = false
      showStatsBlock.value = true
    })

    const { t } = useI18n()

    return {
      t,
      showStatsBlock,
      showHidden,
      showFilterSources,
      totalSelectedMods: computed(() => {
        return props.stats.filter(stat => !stat.disabled).length
      }),
      shownStats: computed(() => {
        if (showHidden.value) {
          return props.stats.filter(s => s.hidden)
        } else {
          return props.stats.filter(s => !s.hidden)
        }
      }),
      toggleStatsBlock () {
        showStatsBlock.value = !showStatsBlock.value
      },
      handleStatsSubmit () {
        ctx.emit('submit')
      }
    }
  }
})
</script>

<style lang="postcss">
.trade-tag {
  @apply bg-gray-900 px-2 rounded;
  @apply border border-gray-500;
  line-height: 1.25rem;

  &.disabled {
    @apply border-gray-900;
  }
}

.trade-tag--box {
  padding: 0;
}
</style>

<i18n>
{
  "ru": {
    "Hidden": "Скрытые",
    "Collapse": "Свернуть",
    "Links: {0}": "Связи: {0}",
    "Map Tier: {0}": "Ур. карты: {0}",
    "Blighted": "Заражённая",
    "Blight-ravaged": "Разорённая Скверной",
    "White: {0}": "Белые: {0}",
    "Level: {0}": "Уровень: {0}",
    "Quality: {0}%": "Качество: {0}%",
    "Shaper": "Создатель",
    "Elder": "Древний",
    "Crusader": "Крестоносец",
    "Hunter": "Охотник",
    "Redeemer": "Избавительница",
    "Warlord": "Вождь",
    "Unidentified": "Неопознанный",
    "Stats ignored": "Св-ва не важны",
    "{0} of {1}, stats": "Св-ва: {0} из {1}",
    "Alva": "Альва",
    "Einhar": "Эйнар",
    "Niko": "Нико",
    "Jun": "Джун",
    "Zana": "Зана",
    "Superior": "Высокого к-ва",
    "Anomalous": "Аномальный",
    "Divergent": "Искривлённый",
    "Phantasmal": "Фантомный",
    "Area Level: {0}": "Ур. области: {0}",
    "Wings Revealed: {0}": "Крыльев обнаружено: {0}",
    "Mirrored": "Отражено",
    "Not Mirrored": "Не отражено",
    "Mods": "Моды",
    "Veiled": "Завуалирован"
  }
}
</i18n>
