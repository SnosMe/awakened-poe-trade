<template>
  <div v-if="show" class="layout-column">
    <div class="m-4 py-1 px-2 bg-gray-900 rounded" v-if="showUnique">
      {{ t('You are trying to price check unidentified Unique item with base type "{0}". Which one?', [baseType]) }}
    </div>
    <div class="m-4 py-1 px-2 bg-gray-900 rounded" v-if="showNormal">
      {{ t('You are trying to price check unidentified Normal item with base type "{0}". Do you wish to price check the base or one of its Unique variants?', [baseType]) }}
    </div>
    <div class="overflow-auto pb-4 px-4">
      <div v-if="showNormal" class="flex flex-wrap">
        <button @click="selectNormal()" class="bg-gray-700 rounded flex items-center p-2 w-full base-item">
          <img :src="item.icon" class="w-12" />
          <div class="pl-3 leading-tight">
            {{ item.name }}
          </div>
        </button>
      </div>
      <div class="flex flex-wrap -m-1">
        <div v-for="item in identifiedVariants" :key="item.name" class="p-1 flex w-1/2">
          <button @click="select(item.refName)" class="bg-gray-700 rounded flex items-center p-2 w-full">
            <img :src="item.icon" class="w-12" />
            <div class="pl-3 leading-tight">{{ item.name }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
  .base-item {
    margin-bottom: 1.4em;
  }
</style>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UNIQUES_LIST, TRANSLATED_ITEM_NAME_BY_REF } from '@/assets/data'
import { ItemRarity, ParsedItem } from '@/parser'

export default defineComponent({
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
        .map(unique => ({
          refName: unique.name,
          icon: unique.icon,
          name: TRANSLATED_ITEM_NAME_BY_REF.get(unique.name) || unique.name
        }))

      // Automatically select unique version for bases that only have one
      // possible outcome. For normal items we also display a button to price
      // check the base, and therefore do not redirect.
      if (showUnique.value && possible.length === 1) {
        select(possible[0].refName)
      }

      return possible
    })

    const showUnique = computed(() => {
      if (!props.item) return false

      return props.item.rarity === ItemRarity.Unique &&
        props.item.isUnidentified &&
        props.item.baseType == null
    })

    const showNormal = computed(() => {
      if (!props.item) return false

      return props.item.rarity === ItemRarity.Normal &&
        props.item.isUnidentified &&
        props.item.baseType == null
    })

    const show = computed(() => {
      if (!props.item) return false

      return showUnique.value || showNormal.value
    })

    const baseType = computed(() => {
      return TRANSLATED_ITEM_NAME_BY_REF.get(props.item!.name) ||
        props.item!.name
    })

    function select (name: string) {
      if ([
        'Agnerod East', 'Agnerod North', 'Agnerod South', 'Agnerod West'
      ].includes(name)) {
        name = 'Agnerod'
      }

      const newItem: ParsedItem = {
        ...props.item!,
        name: name,
        baseType: props.item!.name,
        rarity: ItemRarity.Unique
      }
      ctx.emit('identify', newItem)
    }

    function selectNormal () {
      const newItem: ParsedItem = {
        ...props.item!,
        isUnidentified: false
      }

      ctx.emit('identify', newItem)
    }

    const { t } = useI18n()

    return {
      t,
      identifiedVariants,
      show,
      showNormal,
      showUnique,
      baseType,
      select,
      selectNormal
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "You are trying to price check unidentified Unique item with base type \"{0}\". Which one?": "Вы пытаетесь сделать прайс-чек неопознанного Уникального предмета с базой \"{0}\". Какого именно?"
  }
}
</i18n>
