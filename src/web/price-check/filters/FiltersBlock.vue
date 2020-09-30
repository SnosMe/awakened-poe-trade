<template>
  <div>
    <div class="flex flex-wrap items-center mb-2 -m-1" @mouseleave="handleMouseLeaveStats">
      <button v-if="filters.linkedSockets" class="trade-tag" :class="{ disabled: filters.linkedSockets.disabled }"
        @click="filters.linkedSockets.disabled = !filters.linkedSockets.disabled">{{ $t('Links: {0}', [filters.linkedSockets.value]) }}</button>
      <div v-if="filters.mapTier" class="trade-tag">{{ $t('Map Tier: {0}', [filters.mapTier.value]) }}</div>
      <div v-if="filters.mapBlighted" class="trade-tag">{{ $t('Blighted') }}</div>
      <div v-if="filters.discriminator" class="trade-tag">{{ $t(filters.discriminator.value) }}</div>
      <filter-numeric-editable :filter="filters.itemLevel" name="Item Level:" />
      <filter-numeric-editable :filter="filters.stackSize" name="Stock:" />
      <button v-if="filters.whiteSockets" class="trade-tag" :class="{ disabled: filters.whiteSockets.disabled }"
        @click="filters.whiteSockets.disabled = !filters.whiteSockets.disabled">{{ $t('White: {0}', [filters.whiteSockets.value]) }}</button>
      <button v-if="filters.gemLevel" class="trade-tag" :class="{ disabled: filters.gemLevel.disabled }"
        @click="filters.gemLevel.disabled = !filters.gemLevel.disabled">{{ $t('Level: {0}', [filters.gemLevel.min]) }}</button>
      <button v-if="filters.quality" class="trade-tag" :class="{ disabled: filters.quality.disabled }"
        @click="filters.quality.disabled = !filters.quality.disabled">{{ $t('Quality: {0}%', [filters.quality.value]) }}</button>
      <button v-if="filters.altQuality" class="trade-tag" :class="{ disabled: filters.altQuality.disabled }"
        @click="filters.altQuality.disabled = !filters.altQuality.disabled">{{ $t(filters.altQuality.value) }}</button>
      <template v-if="filters.influences">
        <button v-for="influence of filters.influences" :key="influence.value" class="trade-tag flex items-center"
          :class="{ disabled: influence.disabled }"
          @click="influence.disabled = !influence.disabled">
          <template v-if="influence.value === 'Shaper'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Shaper.png">
            <span class="ml-2">{{ $t('Shaper') }}</span>
          </template>
          <template v-if="influence.value === 'Elder'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Elder.png">
            <span class="ml-2">{{ $t('Elder') }}</span>
          </template>
          <template v-if="influence.value === 'Crusader'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Crusader.png">
            <span class="ml-2">{{ $t('Crusader') }}</span>
          </template>
          <template v-if="influence.value === 'Hunter'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Hunter.png">
            <span class="ml-2">{{ $t('Hunter') }}</span>
          </template>
          <template v-if="influence.value === 'Redeemer'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Redeemer.png">
            <span class="ml-2">{{ $t('Redeemer') }}</span>
          </template>
          <template v-if="influence.value === 'Warlord'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Warlord.png">
            <span class="ml-2">{{ $t('Warlord') }}</span>
          </template>
        </button>
      </template>
      <button v-if="filters.unidentified" class="trade-tag" :class="{ disabled: filters.unidentified.disabled }"
        @click="filters.unidentified.disabled = !filters.unidentified.disabled">{{ $t('Unidentified') }}</button>
      <filter-veiled :item="item" :filters="filters" />
      <button v-if="stats.length" class="trade-tag" :class="{ disabled: totalSelectedMods === 0 }" @click="toggleStatsBlock">
        <span v-if="totalSelectedMods === 0">{{ $t('Stats ignored') }}</span>
        <span v-else>{{ $t('{0} of {1}, stats', [totalSelectedMods, stats.length]) }}</span>
        <i v-if="!showStatsBlock" class="fas fa-chevron-down pl-2 text-xs text-gray-400"></i>
      </button>
    </div>
    <div v-if="showStatsBlock && stats.length" class="my-4">
      <form @submit.prevent="handleStatsSubmit" @mouseleave="handleMouseLeaveStats">
        <filter-modifier v-for="filter of shownStats" :key="filter.type + '/' + filter.text"
          :filter="filter"
          :item="item"
          @submit="handleStatsSubmit" />
        <input type="submit" class="hidden" />
      </form>
      <div class="flex">
        <button @click="toggleStatsBlock" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ $t('Collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <button v-if="shownStats.length != stats.length"
          @click="showHidden = !showHidden" class="ml-2 px-2 pt-2 flex items-center leading-none">
          <i v-if="showHidden" class="fas fa-toggle-on pr-1 text-gray-300"></i>
          <i v-else class="fas fa-toggle-off pr-1 text-gray-600"></i>
          <span class="text-gray-400">{{ $t('Hidden') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import FilterModifier from './FilterModifier'
import FilterVeiled from './FilterVeiled'
import FilterNumericEditable from './FilterNumericEditable'

export default {
  name: 'FiltersBlock',
  components: {
    FilterModifier,
    FilterVeiled,
    FilterNumericEditable
  },
  props: {
    filters: {
      type: Object,
      required: true
    },
    stats: {
      type: Array,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      showStatsBlock: true,
      showHidden: false
    }
  },
  watch: {
    item () {
      this.showHidden = false
    }
  },
  computed: {
    totalSelectedMods () {
      return this.stats.filter(stat => !stat.disabled).length
    },
    shownStats () {
      if (this.showHidden) {
        return this.stats.filter(s => s.hidden)
      } else {
        return this.stats.filter(s => !s.hidden)
      }
    }
  },
  methods: {
    toggleStatsBlock () {
      this.showStatsBlock = !this.showStatsBlock
    },
    handleStatsSubmit () {
      this.$emit('submit')
    },
    handleMouseLeaveStats (e) {
      // ignore if mouse moves to filters block
      if (e.offsetY > 0) {
        this.handleStatsSubmit()
        if (document.activeElement) {
          document.activeElement.blur()
        }
      }
    }
  }
}
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
    "Phantasmal": "Фантомный"
  }
}
</i18n>
