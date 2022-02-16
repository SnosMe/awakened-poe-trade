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
      <filter-btn-logical v-if="filters.mirrored" active
        :filter="filters.mirrored" :text="filters.mirrored.disabled ? 'Not Mirrored' : 'Mirrored'" />
      <filter-btn-logical v-if="stats.length"
        :collapse="statsVisibility.disabled"
        :filter="statsVisibility"
        :active="totalSelectedMods > 0"
        :text="(totalSelectedMods > 0)
          ? t('{0} of {1}, stats', [totalSelectedMods, stats.length])
          : t('Stats ignored')"
      />
    </div>
    <div v-if="!statsVisibility.disabled && stats.length" class="my-4">
      <form @submit.prevent="handleStatsSubmit">
        <filter-modifier v-for="filter of shownStats" :key="filter.tag + '/' + filter.text"
          :filter="filter"
          :item="item"
          :show-sources="showFilterSources"
          @submit="handleStatsSubmit" />
        <unknown-modifier v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
          :stat="stat" />
        <input type="submit" class="hidden" />
      </form>
      <div class="flex gap-x-4">
        <button @click="statsVisibility.disabled = !statsVisibility.disabled" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ t('Collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <ui-toggle v-if="shownStats.length != stats.length"
          v-model="showHidden" class="text-gray-400 pt-2">{{ t('Hidden') }}</ui-toggle>
        <!-- <ui-toggle
          v-model="showFilterSources" class="ml-auto text-gray-400 pt-2">{{ t('Mods') }}</ui-toggle> -->
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
import { ParsedItem } from '@/parser'

export default defineComponent({
  name: 'FiltersBlock',
  emits: ['submit'],
  components: {
    FilterModifier,
    FilterBtnNumeric,
    FilterBtnLogical,
    UnknownModifier
  },
  props: {
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

    const { t } = useI18n()

    return {
      t,
      statsVisibility,
      showHidden,
      showFilterSources,
      totalSelectedMods: computed(() => {
        return props.stats.filter(stat => !stat.disabled).length
      }),
      shownStats: computed(() => {
        if (showHidden.value) {
          return props.stats.filter(s => s.hidden)
        } else {
          return props.stats.filter(s => !s.hidden)
        }
      }),
      handleStatsSubmit () {
        ctx.emit('submit')
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Hidden": "Скрытые",
    "Collapse": "Свернуть",
    "Stats ignored": "Св-ва не важны",
    "{0} of {1}, stats": "Св-ва: {0} из {1}",
    "Mods": "Моды"
  }
}
</i18n>
