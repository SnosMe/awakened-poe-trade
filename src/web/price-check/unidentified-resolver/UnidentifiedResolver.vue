<template>
  <div v-if="show" class="p-4 layout-column">
    <div class="py-1 px-2 bg-gray-900 rounded mb-4">You are trying to price check unidentified Unique item with base type "{{ item.name }}". Which one?</div>
    <div class="flex flex-wrap -m-1">
      <div v-for="item in identifiedVariants" :key="item.name" class="p-1 flex w-1/2">
        <button @click="select(item.name)" class="bg-gray-700 rounded flex items-center p-2 w-full">
          <img :src="item.icon" class="w-12" />
          <div class="pl-3 leading-tight">{{ item.name }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { UniquesList } from '@/assets/data'
import { ItemRarity } from '@/parser'

export default {
  props: {
    item: {
      type: Object,
      required: false
    }
  },
  computed: {
    identifiedVariants () {
      const name = this.item.name
      const possible = UniquesList.filter(unique => unique.basetype === name)
      if (possible.length === 1) {
        this.select(possible[0].name)
      }

      return possible
    },
    show () {
      if (!this.item) return false

      return this.item.rarity === ItemRarity.Unique &&
        this.item.isUnidentified &&
        this.item.baseType == null
    }
  },
  methods: {
    select (name) {
      const newItem = {
        ...this.item,
        name: name,
        baseType: this.item.name
      }
      this.$emit('identify', newItem)
    }
  }
}
</script>
