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
import { ItemRarity, ParsedItem } from '@/parser'
import { ItemFilters } from './interfaces'
import { CATEGORY_TO_TRADE_ID } from '../trade/pathofexile-trade'
import { TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'

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
      if (props.filters.name) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(props.filters.name.value) ||
          props.filters.name.value
      }
      if (props.filters.baseType) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(props.filters.baseType.value) ||
          props.filters.baseType.value
      }
      if (props.filters.category) {
        return t(`Category: ${props.filters.category.value}`)
      }

      return '??? Report if you see this text'
    })

    const canFilterByCategory = computed(() => {
      return props.item.rarity !== ItemRarity.Unique &&
        props.item.category != null &&
        CATEGORY_TO_TRADE_ID.has(props.item.category)
    })

    const showAsActive = computed(() => {
      return canFilterByCategory.value &&
        (props.filters.name || props.filters.baseType)
    })

    function toggleAccuracy () {
      if (!canFilterByCategory.value) return

      if (props.filters.category) {
        props.filters.category = undefined
        props.filters.baseType = {
          value: props.item.baseType || props.item.name
        }
      } else {
        props.filters.baseType = undefined
        props.filters.category = {
          value: props.item.category!
        }
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
  }
}
</i18n>
