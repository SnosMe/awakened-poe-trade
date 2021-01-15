<template>
  <ui-popover v-if="filters.veiled" tag-name="div" placement="bottom-start" boundary="#price-window">
    <template #target>
      <div class="trade-tag flex items-center" :class="{ disabled: filters.veiled.disabled }">
        <span>{{ t(text) }}</span>
        <i v-if="showIcon" class="fas fa-caret-down pl-2 text-gray-400"></i>
      </div>
    </template>
    <template #content>
      <div class="p-2 bg-gray-800 text-gray-400">
        <div class="mb-1" v-for="opt of options" :key="opt.value">
          <ui-radio v-model="filters.veiled.stat" :value="opt.value">{{ t(opt.label) }}</ui-radio>
        </div>
        <ui-toggle v-model="filters.veiled.disabled">{{ t('Disable filter') }}</ui-toggle>
      </div>
    </template>
  </ui-popover>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VEILED_STAT } from './veiled'
import { ItemRarity, ParsedItem } from '@/parser'
import { ItemFilters } from './interfaces'

export default defineComponent({
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
    const text = computed(() => {
      return VEILED_STAT.find(s => s.stat === props.filters.veiled!.stat)!.name
    })

    const options = computed(() => {
      return VEILED_STAT.filter(s => s.test(props.item)).map(s => ({
        label: s.name,
        value: s.stat
      }))
    })

    const showIcon = computed(() => {
      return options.value.length > 1 &&
        props.item.rarity !== ItemRarity.Unique
    })

    const { t } = useI18n()

    return {
      t,
      text,
      options,
      showIcon
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Veiled": "Завуалирован",
    "Syndicate: Leo": "Синдикат: Лео",
    "Mastermind: Catarina": "Организатор: Катарина",
    "Syndicate: Elreon": "Синдикат: Элреон",
    "Syndicate: Vorici": "Синдикат: Воричи",
    "Syndicate: Haku": "Синдикат: Хаку",
    "Syndicate: Tora": "Синдикат: Тора",
    "Syndicate: Vagan": "Синдикат: Ваган",
    "Syndicate: Guff": "Синдикат: Гафф",
    "Syndicate: It That Fled": "Синдикат: То-Что-Сбежало",
    "Syndicate: Gravicius": "Синдикат: Гравиций",
    "Syndicate: Korell": "Синдикат: Корелл",
    "Syndicate: Rin": "Синдикат: Рин",
    "Syndicate: Janus": "Синдикат: Янус",
    "Syndicate: Hillock": "Синдикат: Хиллок",
    "Syndicate: Jorgin": "Синдикат: Йоргин",
    "Syndicate: Cameria": "Синдикат: Камериа",
    "Syndicate: Aisling": "Синдикат: Ашлинг",
    "Syndicate: Riker": "Синдикат: Райкер",
    "Disable filter": "Отключить фильтр"
  }
}
</i18n>
