<template>
  <div class="bg-gray-900 mb-2 leading-none rounded">
    <button class="py-1 px-2" @click="toggleAccuracy">{{ label }}</button>
  </div>
</template>

<script>
import { ItemRarity, ItemCategory } from '../Parser'

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
        return `Type: ${this.filters.category.value}`
      }

      return '??? Report if you see this text'
    }
  },
  methods: {
    toggleAccuracy () {
      if (
        this.item.rarity === ItemRarity.Unique ||
        !this.item.computed.category ||
        [ItemCategory.Map, ItemCategory.Prophecy, ItemCategory.ItemisedMonster].includes(this.item.computed.category)
      ) return

      if (this.filters.category) {
        this.filters.category = undefined
        this.$set(this.filters, 'baseType', {
          value: this.item.baseType || this.item.name
        })
      } else {
        this.filters.baseType = undefined
        this.$set(this.filters, 'category', {
          value: this.item.computed.category
        })
      }
    }
  }
}
</script>
