<template>
  <div>
    <div class="flex flex-wrap items-center mb-2 -m-1">
      <div v-if="filters.linkedSockets" class="trade-tag">Links: {{ filters.linkedSockets.value }}</div>
      <div v-if="filters.mapTier" class="trade-tag">Map Tier: {{ filters.mapTier.value }}</div>
      <button v-if="filters.itemLevel" class="trade-tag" :class="{ disabled: filters.itemLevel.disabled }"
        @click="filters.itemLevel.disabled = !filters.itemLevel.disabled">Item Level: {{ filters.itemLevel.value }}</button>
      <div v-if="filters.gemLevel" class="trade-tag">Level: {{ filters.gemLevel.min }}</div>
      <div v-if="filters.quality" class="trade-tag">Quality: {{ filters.quality.min }}%</div>
      <template v-if="filters.influences">
        <button v-for="influence of filters.influences" :key="influence.value" class="trade-tag flex items-center"
          :class="{ disabled: influence.disabled }"
          @click="influence.disabled = !influence.disabled">
          <template v-if="influence.value === 'Shaper'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Shaper.png">
            <span class="ml-2">Shaper</span>
          </template>
          <template v-if="influence.value === 'Elder'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Elder.png">
            <span class="ml-2">Elder</span>
          </template>
          <template v-if="influence.value === 'Crusader'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Crusader.png">
            <span class="ml-2">Crusader</span>
          </template>
          <template v-if="influence.value === 'Hunter'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Hunter.png">
            <span class="ml-2">Hunter</span>
          </template>
          <template v-if="influence.value === 'Redeemer'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Redeemer.png">
            <span class="ml-2">Redeemer</span>
          </template>
          <template v-if="influence.value === 'Warlord'">
            <img class="w-5 h-5 -m-1" src="@/assets/influence/Warlord.png">
            <span class="ml-2">Warlord</span>
          </template>
        </button>
      </template>
      <button v-if="stats.length" class="trade-tag" :class="{ disabled: totalSelectedMods === 0 }" @click="toggleStatsBlock">
        <span v-if="totalSelectedMods === 0">Stats ignored</span>
        <span v-else>{{ totalSelectedMods }} of {{ stats.length }}, stats</span>
      </button>
    </div>
    <div v-if="showStatsBlock && stats.length" class="my-4">
      <filter-modifier v-for="filter of stats" :key="filter.id"
        :filter="filter"/>
      <button @click="toggleStatsBlock" class="btn w-40 mt-2">Collapse <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
    </div>
  </div>
</template>

<script>
import FilterModifier from './FilterModifier'

export default {
  name: 'FiltersBlock',
  components: {
    FilterModifier
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
      showStatsBlock: true
    }
  },
  computed: {
    totalSelectedMods () {
      return this.stats.filter(stat => !stat.disabled).length
    }
  },
  methods: {
    toggleStatsBlock () {
      this.showStatsBlock = !this.showStatsBlock
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
</style>
