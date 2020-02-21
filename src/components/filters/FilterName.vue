<template>
  <div class="filter-name">
    <button class="px-2 rounded border"
      :class="{ 'border-gray-500': showAsActive, 'border-gray-900': !showAsActive }"
      @click="toggleAccuracy">{{ label }}</button>
    <button v-if="filters.corrupted" class="px-2" @click="filters.corrupted.value = !filters.corrupted.value">
      <span v-if="filters.corrupted.value" class="text-red-500">Corrupted</span>
      <span v-else class="text-gray-600">Not Corrupted</span>
    </button>
  </div>
</template>

<script>
import { ItemRarity, ItemCategory } from '../parser'

export default {
  name: 'FilterName',
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
    label () {
      if (this.filters.name) {
        return this.filters.name.value
      }
      if (this.filters.baseType) {
        return this.filters.baseType.value
      }
      if (this.filters.category) {
        return `Category: ${this.filters.category.value}`
      }

      return '??? Report if you see this text'
    },
    showAsActive () {
      if (
        this.item.rarity === ItemRarity.Unique ||
        !this.item.category ||
        [ItemCategory.Map, ItemCategory.Prophecy, ItemCategory.ItemisedMonster].includes(this.item.category)
      ) {
        return false
      }

      return !this.label.startsWith('Category:')
    }
  },
  methods: {
    toggleAccuracy () {
      if (
        this.item.rarity === ItemRarity.Unique ||
        !this.item.category ||
        [ItemCategory.Map, ItemCategory.Prophecy, ItemCategory.ItemisedMonster].includes(this.item.category)
      ) return

      if (this.filters.category) {
        this.filters.category = undefined
        this.$set(this.filters, 'baseType', {
          value: this.item.baseType || this.item.name
        })
      } else {
        this.filters.baseType = undefined
        this.$set(this.filters, 'category', {
          value: this.item.category
        })
      }
    }
  }
}
</script>

<style lang="postcss">
.filter-name {
  @apply bg-gray-900 mb-2 rounded;
  line-height: 1.25rem;
  display: flex;
  justify-content: space-between;
}
</style>
