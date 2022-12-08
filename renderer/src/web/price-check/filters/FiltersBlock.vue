<template>
  <div>
    <div class="flex flex-wrap items-center pb-3 gap-2">
      <filter-btn-numeric v-if="filters.linkedSockets"
        :filter="filters.linkedSockets" name="Links:" />
      <filter-btn-numeric v-if="filters.mapTier"
        :filter="filters.mapTier" name="Map Tier:" />
      <filter-btn-numeric v-if="filters.areaLevel"
        :filter="filters.areaLevel" name="Area Level:" />
      <filter-btn-numeric v-if="filters.heistWingsRevealed"
        :filter="filters.heistWingsRevealed" name="Wings Revealed:" />
      <filter-btn-numeric v-if="filters.sentinelCharge"
        :filter="filters.sentinelCharge" name="Charge:" />
      <filter-btn-logical v-if="filters.mapBlighted" readonly
        :filter="{ disabled: false }" :text="filters.mapBlighted.value" />
      <filter-btn-logical v-if="filters.discriminator" readonly
        :filter="{ disabled: false }" :text="filters.discriminator.value" />
      <filter-btn-numeric v-if="filters.itemLevel"
        :filter="filters.itemLevel" name="Item Level:" />
      <filter-btn-numeric v-if="filters.stackSize"
        :filter="filters.stackSize" name="Stock:" />
      <filter-btn-numeric v-if="filters.whiteSockets"
        :filter="filters.whiteSockets" name="White:" />
      <filter-btn-numeric v-if="filters.gemLevel"
        :filter="filters.gemLevel" name="Level:" />
      <filter-btn-numeric v-if="filters.quality"
        :filter="filters.quality" name="Quality:" />
      <filter-btn-logical v-if="filters.altQuality"
        :filter="filters.altQuality" :text="filters.altQuality.value" />
      <template v-if="filters.influences">
        <filter-btn-logical v-for="influence of filters.influences" :key="influence.value"
          :filter="influence" :text="influence.value" :img="`/images/influence-${influence.value}.png`" />
      </template>
      <filter-btn-logical v-if="filters.unidentified"
        :filter="filters.unidentified" text="Unidentified" />
      <filter-btn-logical v-if="filters.veiled"
        :filter="filters.veiled" text="Veiled" />
      <filter-btn-logical v-if="filters.relic"
        :filter="filters.relic" text="Relic Unique" />
      <filter-btn-logical v-if="filters.mirrored" active
        :filter="filters.mirrored" :text="filters.mirrored.disabled ? 'Not Mirrored' : 'Mirrored'" />
      <filter-btn-logical v-if="hasStats"
        :collapse="statsVisibility.disabled"
        :filter="statsVisibility"
        :active="totalSelectedMods > 0"
        :text="(totalSelectedMods > 0)
          ? t('{0} of {1}, stats', [totalSelectedMods, stats.length])
          : t('Stats ignored')"
      />
    </div>
    <div v-if="!statsVisibility.disabled && hasStats" class="mb-4" :class="(presets.length > 1) ? 'mt-1' : 'mt-4'">
      <div class="flex" v-if="presets.length > 1">
        <div class="w-5 border-b border-gray-700" />
        <div class="flex divide-x border-gray-700 border-t border-l border-r rounded-t overflow-hidden">
          <button v-for="preset in presets"
            :class="[$style.presetBtn, { [$style.active]: preset.active }]"
            @click="selectPreset(preset.id)"
          >{{ t(preset.id) }}</button>
        </div>
        <div class="flex-1 border-b border-gray-700" />
      </div>
      <form @submit.prevent="handleStatsSubmit">
        <filter-modifier v-for="filter of filteredStats" :key="filter.tag + '/' + filter.text"
          :filter="filter"
          :item="item"
          :show-sources="showFilterSources"
          @submit="handleStatsSubmit" />
        <div v-if="!filteredStats.length && !showUnknownMods"
          class="border-b border-gray-700 py-2">{{ t('No relevant stats were found') }}</div>
        <template v-if="showUnknownMods">
          <unknown-modifier v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
            :stat="stat" />
        </template>
        <input type="submit" class="hidden" />
      </form>
      <div class="flex gap-x-4">
        <button @click="statsVisibility.disabled = !statsVisibility.disabled" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ t('Collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <ui-toggle v-if="filteredStats.length != stats.length"
          v-model="showHidden" class="text-gray-400 pt-2">{{ t('Hidden') }}</ui-toggle>
        <ui-toggle
          v-model="showFilterSources" class="ml-auto text-gray-400 pt-2">{{ t('Mods') }}</ui-toggle>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, shallowRef, shallowReactive, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterModifier from './FilterModifier.vue'
import FilterBtnNumeric from './FilterBtnNumeric.vue'
import FilterBtnLogical from './FilterBtnLogical.vue'
import UnknownModifier from './UnknownModifier.vue'
import { ItemFilters, StatFilter } from './interfaces'
import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'

export default defineComponent({
  name: 'FiltersBlock',
  emits: ['submit', 'preset'],
  components: {
    FilterModifier,
    FilterBtnNumeric,
    FilterBtnLogical,
    UnknownModifier
  },
  props: {
    presets: {
      type: Array as PropType<Array<{ id: string, active: boolean }>>,
      required: true
    },
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props, ctx) {
    const statsVisibility = shallowReactive({ disabled: false })
    const showHidden = shallowRef(false)
    const showFilterSources = shallowRef(false)

    watch(() => props.item, () => {
      showHidden.value = false
      statsVisibility.disabled = false
    })

    const showUnknownMods = computed(() =>
      props.item.unknownModifiers.length &&
      props.item.category !== ItemCategory.Sentinel
    )

    const { t } = useI18n()

    return {
      t,
      statsVisibility,
      showHidden,
      showFilterSources,
      totalSelectedMods: computed(() => {
        return props.stats.filter(stat => !stat.disabled).length
      }),
      filteredStats: computed(() => {
        if (showHidden.value) {
          return props.stats.filter(s => s.hidden)
        } else {
          return props.stats.filter(s => !s.hidden)
        }
      }),
      showUnknownMods,
      hasStats: computed(() =>
        props.stats.length ||
        (showUnknownMods.value && props.item.rarity === ItemRarity.Unique) ||
        props.presets.length > 1),
      handleStatsSubmit () {
        ctx.emit('submit')
      },
      selectPreset (id: string) {
        ctx.emit('preset', id)
      }
    }
  }
})
</script>

<style lang="postcss" module>
.presetBtn {
  @apply border-gray-700 bg-gray-800;
  @apply px-2;
  min-width: 3rem;

  &:hover {
    @apply bg-gray-700;
  }

  &.active {
    background: linear-gradient(to bottom, theme('colors.gray.900'), theme('colors.gray.800'));
  }
}
</style>

<i18n>
{
  "ru": {
    "Hidden": "Скрытые",
    "Collapse": "Свернуть",
    "Stats ignored": "Св-ва не важны",
    "{0} of {1}, stats": "Св-ва: {0} из {1}",
    "Mods": "Моды",
    "No relevant stats were found": "Подходящие свойства не найдены",

    "Pseudo": "Псевдо",
    "Base item": "База предмета"
  },
  "cmn-Hant": {
    "Hidden": "被隱藏",
    "Collapse": "折疊",
    "Stats ignored": "忽略詞綴",
    "{0} of {1}, stats": "詞綴: {0}/{1}",
    "Mods": "Mods",
    "No relevant stats were found": "找不到詞綴",

    "Pseudo": "偽屬性",
    "Base item": "物品基底"
  },
  "zh_CN": {
    "Hidden": "已隐藏",
    "Collapse": "折叠",
    "Stats ignored": "忽略词缀",
    "{0} of {1}, stats": "词缀: {0}/{1}",
    "Mods": "Mods",
    "No relevant stats were found": "找不到词缀",

    "Pseudo": "伪属性",
    "Base item": "物品基底"
  }
}
</i18n>
