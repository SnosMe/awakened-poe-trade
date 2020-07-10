<template>
  <div v-if="show" class="p-4 layout-column">
    <div class="py-1 px-2 bg-gray-900 rounded mb-4">{{ $t('You are trying to price check unidentified Unique item with base type "{0}". Which one?', [baseType]) }}</div>
    <div class="flex flex-wrap -m-1">
      <div v-for="item in identifiedVariants" :key="item.name" class="p-1 flex w-1/2">
        <button @click="select(item.refName)" class="bg-gray-700 rounded flex items-center p-2 w-full">
          <img :src="item.icon" class="w-12" />
          <div class="pl-3 leading-tight">{{ item.name }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { UNIQUES_LIST, TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
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
      const possible = UNIQUES_LIST
        .filter(unique => unique.basetype === name)
        .map(unique => ({
          refName: unique.name,
          icon: unique.icon,
          name: TRANSLATED_ITEM_NAME_BY_REF.get(unique.name) || unique.name
        }))

      if (possible.length === 1) {
        this.select(possible[0].refName)
      }

      return possible
    },
    show () {
      if (!this.item) return false

      return this.item.rarity === ItemRarity.Unique &&
        this.item.isUnidentified &&
        this.item.baseType == null
    },
    baseType () {
      return TRANSLATED_ITEM_NAME_BY_REF.get(this.item.name) ||
        this.item.name
    }
  },
  methods: {
    select (name) {
      if ([
        'Agnerod East', 'Agnerod North', 'Agnerod South', 'Agnerod West'
      ].includes(name)) {
        name = 'Agnerod'
      }

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

<i18n>
{
  "ru": {
    "You are trying to price check unidentified Unique item with base type \"{0}\". Which one?": "Вы пытаетесь сделать прайс-чек неопознанного Уникального предмета с базой \"{0}\". Какого именно?"
  }
}
</i18n>
