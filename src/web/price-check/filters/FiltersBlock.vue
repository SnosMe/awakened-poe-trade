<template>
  <div>
    <div class="flex flex-wrap items-center pb-3 gap-2">
      <filter-numeric-editable v-if="filters.linkedSockets"
        :filter="filters.linkedSockets" name="Links:" />
      <filter-numeric-editable v-if="filters.mapTier"
        :filter="filters.mapTier" name="Map Tier:" />
      <filter-numeric-editable v-if="filters.areaLevel"
        :filter="filters.areaLevel" name="Area Level:" />
      <filter-numeric-editable v-if="filters.heistWingsRevealed"
        :filter="filters.heistWingsRevealed" name="Wings Revealed:" />
      <div v-if="filters.mapBlighted" class="trade-tag">{{ t(filters.mapBlighted.value) }}</div>
      <div v-if="filters.discriminator" class="trade-tag">{{ t(filters.discriminator.value) }}</div>
      <filter-numeric-editable v-if="filters.itemLevel"
        :filter="filters.itemLevel" name="Item Level:" />
      <filter-numeric-editable v-if="filters.stackSize"
        :filter="filters.stackSize" name="Stock:" />
      <filter-numeric-editable v-if="filters.whiteSockets"
        :filter="filters.whiteSockets" name="White:" />
      <filter-numeric-editable v-if="filters.gemLevel"
        :filter="filters.gemLevel" name="Level:" />
      <filter-numeric-editable v-if="filters.quality"
        :filter="filters.quality" name="Quality:" />
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
</style>

<i18n>
{
  "ru": {
    "Hidden": "Скрытые",
    "Collapse": "Свернуть",
    "Blighted": "Заражённая",
    "Blight-ravaged": "Разорённая Скверной",
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
    "Mirrored": "Отражено",
    "Not Mirrored": "Не отражено",
    "Mods": "Моды",
    "Veiled": "Завуалирован"
  }
}
</i18n>
