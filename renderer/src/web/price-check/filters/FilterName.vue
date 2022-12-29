<template>
  <div class="filter-name">
    <button class="px-2 rounded border"
      :class="{ 'border-gray-500': showAsActive, 'border-gray-900': !showAsActive }"
      @click="toggleAccuracy">{{ label }}</button>
    <button v-if="filters.corrupted" class="px-2" @click="corrupted = !corrupted">
      <span v-if="corrupted" class="text-red-500">{{ t('Corrupted') }}</span>
      <span v-else class="text-gray-600">{{ t('Not Corrupted') }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import type { ItemFilters } from './interfaces'

export default defineComponent({
  name: 'FilterName',
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const label = computed(() => {
      const { filters } = props
      const activeSearch = (filters.searchRelaxed && !filters.searchRelaxed.disabled)
        ? filters.searchRelaxed
        : filters.searchExact

      if (activeSearch.name) {
        return activeSearch.name
      }
      if (activeSearch.baseType) {
        return activeSearch.baseType
      }
      if (activeSearch.category) {
        return t(`Category: ${activeSearch.category}`)
      }

      return '??? Report if you see this text'
    })

    const showAsActive = computed(() => {
      const { filters } = props
      return filters.searchRelaxed?.disabled
    })

    function toggleAccuracy () {
      const { filters } = props
      if (filters.searchRelaxed) {
        filters.searchRelaxed.disabled = !filters.searchRelaxed.disabled
      }
    }

    const corrupted = computed<boolean>({
      get () { return props.filters.corrupted!.value },
      set (value) { props.filters.corrupted!.value = value }
    })

    return {
      t,
      label,
      showAsActive,
      toggleAccuracy,
      corrupted
    }
  }
})
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
  },
  "zh_CN": {
    "Corrupted": "已腐化",
    "Not Corrupted": "未腐化",
    "Category: Abyss Jewel": "类型: 深渊珠宝",
    "Category: Amulet": "类型: 项链",
    "Category: Belt": "类型: 腰带",
    "Category: Body Armour": "类型: 身体护具",
    "Category: Boots": "类型: 鞋子",
    "Category: Bow": "类型: 弓",
    "Category: Claw": "类型: 爪",
    "Category: Dagger": "类型: 匕首",
    "Category: Fishing Rod": "类型: 鱼竿",
    "Category: Flask": "类型: 药剂",
    "Category: Gloves": "类型: 手套",
    "Category: Helmet": "类型: 头盔",
    "Category: Jewel": "类型: 珠宝",
    "Category: One-Handed Axe": "类型: 单手斧",
    "Category: One-Handed Mace": "类型: 单手锤",
    "Category: One-Handed Sword": "类型: 单手剑",
    "Category: Quiver": "类型: 箭袋",
    "Category: Ring": "类型: 戒指",
    "Category: Rune Dagger": "类型: 符文匕首",
    "Category: Sceptre": "类型: 权杖",
    "Category: Shield": "类型: 盾",
    "Category: Staff": "类型: 长杖",
    "Category: Two-Handed Axe": "类型: 双手斧",
    "Category: Two-Handed Mace": "类型: 双手锤",
    "Category: Two-Handed Sword": "类型: 双手剑",
    "Category: Wand": "类型: 法杖",
    "Category: Warstaff": "类型: 战杖",
    "Category: Cluster Jewel": "类型: 星团珠宝",
    "Category: Heist Blueprint": "类型: 夺宝蓝图",
    "Category: Heist Contract": "类型: 夺宝契约",
    "Category: Heist Tool": "类型: 夺宝工具",
    "Category: Heist Brooch": "类型: 夺宝胸针",
    "Category: Heist Gear": "类型: 夺宝装置",
    "Category: Heist Cloak": "类型: 夺宝斗篷",
    "Category: Trinket": "类型: 饰品"
  }
}
</i18n>
