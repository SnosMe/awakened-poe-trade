<template>
  <div v-if="show" class="layout-column">
    <div class="m-4 py-1 px-2 bg-gray-900 rounded">
      {{ t('You are trying to price check unidentified {0} item with base type "{1}". It possibly can be one of uniques:', [rarity, baseType]) }}
    </div>
    <div class="overflow-auto pb-4 px-4">
      <div class="flex flex-wrap -m-1">
        <div v-for="unique in identifiedVariants" :key="unique.item.name" class="p-1 flex w-full">
          <button @click="select(unique.item)" class="bg-gray-700 rounded flex items-center p-2 w-full">
            <img :src="unique.item.icon" class="w-12" />
            <div class="flex-1 pl-3 text-left leading-tight">{{ unique.renderName }}</div>
            <item-quick-price
              :min="unique.price.val"
              :max="unique.price.val"
              :hideItem="true"
              :currency="unique.price.curr === 'e' ? 'exa' : 'chaos'"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UNIQUES_LIST, TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
import { ItemRarity, ParsedItem } from '@/parser'
import ItemQuickPrice from '@/web/ui/ItemQuickPrice.vue'
import { findByDetailsId, autoCurrency } from '../../background/Prices'
import { getDetailsId } from '../trends/getDetailsId'

export default defineComponent({
  components: {
    ItemQuickPrice
  },
  emits: ['identify'],
  props: {
    item: {
      type: Object as PropType<ParsedItem | undefined>,
      default: undefined
    }
  },
  setup (props, ctx) {
    const identifiedVariants = computed(() => {
      const name = props.item!.name
      const possible = UNIQUES_LIST
        .filter(unique => unique.basetype === name)
        .map(unique => {
          const item = getUniqueItem(props.item!, unique.name, unique.icon)
          const price = autoCurrency(findByDetailsId(getDetailsId(item)!)!.receive.chaosValue, 'c')
          return {
            renderName: TRANSLATED_ITEM_NAME_BY_REF.get(item.name) || item.name,
            item,
            price
          }
        })

      if (possible.length === 1 && props.item!.rarity === ItemRarity.Unique) {
        select(possible[0].item)
      }
      return possible
    })

    const show = computed(() => {
      if (!props.item) return false

      return (props.item.rarity === ItemRarity.Unique || props.item.rarity === ItemRarity.Normal) &&
        props.item.isUnidentified &&
        props.item.baseType == null
    })

    const baseType = computed(() => {
      return TRANSLATED_ITEM_NAME_BY_REF.get(props.item!.name) ||
        props.item!.name
    })

    const rarity = computed(() => {
      return props.item!.rarity
    })

    function select (item: ParsedItem) {
      ctx.emit('identify', item)
    }

    function getUniqueItem (base: ParsedItem, name: string, icon: string) {
      if ([
        'Agnerod East', 'Agnerod North', 'Agnerod South', 'Agnerod West'
      ].includes(name)) {
        name = 'Agnerod'
      }

      return {
        ...base,
        name: name,
        baseType: base.name,
        isUnidentified: false,
        rarity: ItemRarity.Unique,
        icon
      }
    }

    const { t } = useI18n()

    return {
      t,
      identifiedVariants,
      show,
      rarity,
      baseType,
      select
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "You are trying to price check unidentified {0} item with base type \"{1}\". It possibly can be one of uniques:": "Вы пытаетесь сделать прайс-чек неопознанного {0} предмета с базой \"{1}\". Это может быть один из уникальных предметов:"
  }
}
</i18n>
