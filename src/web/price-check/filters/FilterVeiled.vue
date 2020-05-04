<template>
  <ui-popper v-if="filters.veiled" tag-name="div" :delayOnMouseOut="150" :options="{ placement: 'bottom-start' }" boundaries-selector="#price-window">
    <template slot="reference">
      <div class="trade-tag flex items-center" :class="{ disabled: filters.veiled.disabled }">
        <span>{{ text }}</span>
        <i v-if="showIcon" class="fas fa-caret-down pl-2 text-gray-400"></i>
      </div>
    </template>
    <div class="popper">
      <div class="p-2 text-left bg-gray-800 text-gray-400">
        <div class="mb-1" v-for="opt of options" :key="opt.value">
          <ui-radio v-model="filters.veiled.stat" :value="opt.value">{{ opt.label }}</ui-radio>
        </div>
        <ui-toggle v-model="filters.veiled.disabled">Disable filter</ui-toggle>
      </div>
    </div>
  </ui-popper>
</template>

<script>
import { VEILED_STAT } from './veiled'
import { ItemRarity } from '@/parser'

export default {
  props: {
    filters: {
      type: Object,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    text () {
      return VEILED_STAT.find(s => s.stat === this.filters.veiled.stat).name
    },
    options () {
      return VEILED_STAT.filter(s => s.test(this.item)).map(s => ({
        label: s.name,
        value: s.stat
      }))
    },
    showIcon () {
      return this.options.length > 1 &&
        this.item.rarity !== ItemRarity.Unique
    }
  }
}
</script>
