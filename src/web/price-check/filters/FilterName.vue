<template>
  <div class="filter-name">
    <button class="px-2 rounded border"
      :class="{ 'border-gray-500': showAsActive, 'border-gray-900': !showAsActive }"
      @click="toggleAccuracy">{{ label }}</button>
    <button v-if="filters.corrupted" class="px-2" @click="filters.corrupted.value = !filters.corrupted.value">
      <span v-if="filters.corrupted.value" class="text-red-500">{{ $t('Corrupted') }}</span>
      <span v-else class="text-gray-600">{{ $t('Not Corrupted') }}</span>
    </button>
  </div>
</template>

<script>
import { ItemRarity } from '@/parser'
import { CATEGORY_TO_TRADE_ID } from '../trade/pathofexile-trade'
import { TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'

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
        return TRANSLATED_ITEM_NAME_BY_REF.get(this.filters.name.value) ||
          this.filters.name.value
      }
      if (this.filters.baseType) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(this.filters.baseType.value) ||
          this.filters.baseType.value
      }
      if (this.filters.category) {
        return this.$t(`Category: ${this.filters.category.value}`)
      }

      return '??? Report if you see this text'
    },
    canFilterByCategory () {
      return this.item.rarity !== ItemRarity.Unique &&
        CATEGORY_TO_TRADE_ID.has(this.item.category)
    },
    showAsActive () {
      return this.canFilterByCategory &&
        (this.filters.name || this.filters.baseType)
    }
  },
  methods: {
    toggleAccuracy () {
      if (!this.canFilterByCategory) return

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

<i18n>
{
  "ru": {
    "Corrupted": "Осквернен",
    "Not Corrupted": "Не осквернен",
    "Category: Abyss Jewel": "Категория: Самоцвет Бездны",
    "Category: Amulet": "Категория: Амулет",
    "Category: Belt": "Категория: Пояс",
    "Category: Body Armour": "Категория: Нательная броня",
    "Category: Boots": "Категория: Сапоги",
    "Category: Bow": "Категория: Лук",
    "Category: Claw": "Категория: Коготь",
    "Category: Dagger": "Категория: Кинжал",
    "Category: Fishing Rod": "Категория: Удочка",
    "Category: Flask": "Категория: Флакон",
    "Category: Gloves": "Категория: Перчатки",
    "Category: Helmet": "Категория: Шлем",
    "Category: Jewel": "Категория: Самоцвет",
    "Category: One-Handed Axe": "Категория: Одноручный топор",
    "Category: One-Handed Mace": "Категория: Одноручная булава",
    "Category: One-Handed Sword": "Категория: Одноручный меч",
    "Category: Quiver": "Категория: Колчан",
    "Category: Ring": "Категория: Кольцо",
    "Category: Rune Dagger": "Категория: Рунический кинжал",
    "Category: Sceptre": "Категория: Скипетр",
    "Category: Shield": "Категория: Щит",
    "Category: Staff": "Категория: Посох",
    "Category: Two-Handed Axe": "Категория: Двуручный топор",
    "Category: Two-Handed Mace": "Категория: Двуручная булава",
    "Category: Two-Handed Sword": "Категория: Двуручный меч",
    "Category: Wand": "Категория: Жезл",
    "Category: Warstaff": "Категория: Воинский посох",
    "Category: Cluster Jewel": "Категория: Кластерный самоцвет",
    "Category: Heist Blueprint": "Категория: Чертёж Кражи",
    "Category: Heist Contract": "Категория: Контракт Кражи",
    "Category: Heist Tool": "Категория: Разбойничий инструмент",
    "Category: Heist Brooch": "Категория: Разбойничья брошь",
    "Category: Heist Gear": "Категория: Разбойничьи принадлежности",
    "Category: Heist Cloak": "Категория: Разбойничья накидка",
    "Category: Trinket": "Категория: Украшение"
  }
}
</i18n>
