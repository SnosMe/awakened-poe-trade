<template>
  <div>
    <div class="flex flex-wrap items-center pb-2 -mx-1 -mt-1">
      <button v-if="filters.linkedSockets" class="trade-tag" :class="{ disabled: filters.linkedSockets.disabled }"
        @click="filters.linkedSockets.disabled = !filters.linkedSockets.disabled">{{ t('Links: {0}', [filters.linkedSockets.value]) }}</button>
      <div v-if="filters.mapTier" class="trade-tag">{{ t('Map Tier: {0}', [filters.mapTier.value]) }}</div>
      <div v-if="filters.areaLevel" class="trade-tag">{{ t('Area Level: {0}', [filters.areaLevel.value]) }}</div>
      <div v-if="filters.heistJob" class="trade-tag">{{ t(`${filters.heistJob.name} (lvl {0})`, [filters.heistJob.level]) }}</div>
      <div v-if="filters.mapBlighted" class="trade-tag">{{ t('Blighted') }}</div>
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
          @click="influence.disabled = !influence.disabled">
          <template v-if="influence.value === 'Shaper'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Shaper.png">
            <span class="ml-2">{{ t('Shaper') }}</span>
          </template>
          <template v-if="influence.value === 'Elder'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Elder.png">
            <span class="ml-2">{{ t('Elder') }}</span>
          </template>
          <template v-if="influence.value === 'Crusader'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Crusader.png">
            <span class="ml-2">{{ t('Crusader') }}</span>
          </template>
          <template v-if="influence.value === 'Hunter'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Hunter.png">
            <span class="ml-2">{{ t('Hunter') }}</span>
          </template>
          <template v-if="influence.value === 'Redeemer'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Redeemer.png">
            <span class="ml-2">{{ t('Redeemer') }}</span>
          </template>
          <template v-if="influence.value === 'Warlord'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Warlord.png">
            <span class="ml-2">{{ t('Warlord') }}</span>
          </template>
        </button>
      </template>
      <button v-if="filters.unidentified" class="trade-tag" :class="{ disabled: filters.unidentified.disabled }"
        @click="filters.unidentified.disabled = !filters.unidentified.disabled">{{ t('Unidentified') }}</button>
      <filter-veiled :item="item" :filters="filters" />
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
        <filter-modifier v-for="filter of shownStats" :key="filter.type + '/' + filter.text"
          :filter="filter"
          :item="item"
          @submit="handleStatsSubmit" />
        <unknown-modifier v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
          :stat="stat" />
        <input type="submit" class="hidden" />
      </form>
      <div class="flex">
        <button @click="toggleStatsBlock" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ t('Collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <button v-if="shownStats.length != stats.length"
          @click="showHidden = !showHidden" class="ml-2 px-2 pt-2 flex items-center leading-none">
          <i v-if="showHidden" class="fas fa-toggle-on pr-1 text-gray-300"></i>
          <i v-else class="fas fa-toggle-off pr-1 text-gray-600"></i>
          <span class="text-gray-400">{{ t('Hidden') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterModifier from './FilterModifier.vue'
import FilterVeiled from './FilterVeiled.vue'
import FilterNumericEditable from './FilterNumericEditable.vue'
import UnknownModifier from './UnknownModifier.vue'
import { ItemFilters, StatFilter } from './interfaces'
import { ParsedItem } from '@/parser'

export default defineComponent({
  name: 'FiltersBlock',
  emits: ['submit'],
  components: {
    FilterModifier,
    FilterVeiled,
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

    watch(() => props.item, () => {
      showHidden.value = false
    })

    const { t } = useI18n()

    return {
      t,
      showStatsBlock,
      showHidden,
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
  @apply bg-gray-900 px-2 m-1 rounded;
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
    "Lockpicking (lvl {0})": "Взлом ({0} ур.)",
    "Counter-Thaumaturgy (lvl {0})": "Контрмагия ({0} ур.)",
    "Perception (lvl {0})": "Восприятие ({0} ур.)",
    "Deception (lvl {0})": "Маскировка ({0} ур.)",
    "Agility (lvl {0})": "Проворство ({0} ур.)",
    "Engineering (lvl {0})": "Инженерное дело ({0} ур.)",
    "Trap Disarmament (lvl {0})": "Разминирование ({0} ур.)",
    "Demolition (lvl {0})": "Взрывное дело ({0} ур.)",
    "Brute Force (lvl {0})": "Грубая сила ({0} ур.)",
    "Mirrored": "Отражено",
    "Not Mirrored": "Не отражено"
  }
}
</i18n>
