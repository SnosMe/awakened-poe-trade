<template>
  <div>
    <div class="flex flex-wrap items-center pb-3 gap-2">
      <filter-btn-numeric v-if="filters.linkedSockets"
        :filter="filters.linkedSockets" :name="t('item.linked_sockets')" />
      <filter-btn-numeric v-if="filters.mapTier"
        :filter="filters.mapTier" :name="t('item.map_tier')" />
      <filter-btn-logical v-if="filters.mapCompletionReward" readonly
        :filter="{ disabled: false }" :text="t('item.map_foil_reward', [filters.mapCompletionReward.name])" />
      <filter-btn-numeric v-if="filters.areaLevel"
        :filter="filters.areaLevel" :name="t('item.area_level')" />
      <template v-if="filters.ultimatum">
        <filter-btn-logical
          :filter="filters.ultimatum.challenge" :text="filters.ultimatum.challenge.label" />
        <filter-btn-logical
          :filter="filters.ultimatum.reward" :text="filters.ultimatum.reward.label" />
        <span v-if="rewardPrice"
          class="inline-flex items-center gap-1 normal-case cursor-pointer hover:brightness-125"
          @click="openRewardNinja" title="poe.ninja">
          <span :style="{ color: rewardPrice.unit.currency === 'div' ? '#e4c29a' : '' }">{{ formatPrice(rewardPrice.unit.min) }}</span>
          <img :src="rewardPrice.unit.currency === 'div' ? '/images/divine.png' : '/images/chaos.png'" class="w-5 h-5">
        </span>
        <filter-btn-logical
          :filter="filters.ultimatum.input" :text="t('item.ultimatum_input', [filters.ultimatum.input.value])" />
        <span v-if="sacrificePrice"
          class="inline-flex items-center gap-1 normal-case cursor-pointer hover:brightness-125"
          @click="openSacrificeNinja" title="poe.ninja">
          <span :style="{ color: sacrificePrice.unit.currency === 'div' ? '#e4c29a' : '' }">{{ formatPrice(sacrificePrice.unit.min) }}</span>
          <img :src="sacrificePrice.unit.currency === 'div' ? '/images/divine.png' : '/images/chaos.png'" class="w-5 h-5">
          <template v-if="sacrificePrice.total">
            <span class="text-gray-500 font-sans">&times; {{ sacrificePrice.amount }} =</span>
            <span :style="{ color: sacrificePrice.total.currency === 'div' ? '#e4c29a' : '' }">{{ formatPrice(sacrificePrice.total.min) }}</span>
            <img :src="sacrificePrice.total.currency === 'div' ? '/images/divine.png' : '/images/chaos.png'" class="w-5 h-5">
          </template>
        </span>
        <span v-if="ultimatumProfit"
          class="inline-flex items-center gap-1 normal-case">
          <i class="fas fa-arrow-right text-gray-600 text-xs"></i>
          <span :style="{ color: ultimatumProfit.min >= 0 ? '#48bb78' : '#f56565' }">
            {{ ultimatumProfit.min >= 0 ? '+' : '' }}{{ formatPrice(ultimatumProfit.min) }}</span>
          <img :src="ultimatumProfit.currency === 'div' ? '/images/divine.png' : '/images/chaos.png'" class="w-5 h-5">
          <span class="text-gray-600 text-xs">profit</span>
        </span>
      </template>
      <filter-btn-numeric v-if="filters.heistWingsRevealed"
        :filter="filters.heistWingsRevealed" :name="t('item.heist_wings_revealed')" />
      <filter-btn-numeric v-if="filters.sentinelCharge"
        :filter="filters.sentinelCharge" :name="t('item.sentinel_charge')" />
      <filter-btn-logical v-if="filters.mapBlighted" readonly
        :filter="{ disabled: false }" :text="filters.mapBlighted.value" />
      <filter-btn-logical v-if="filters.discriminator?.value" readonly
        :filter="{ disabled: false }" :text="filters.discriminator.value" />
      <filter-btn-numeric v-if="filters.itemLevel"
        :filter="filters.itemLevel" :name="t('item.item_level')" />
      <filter-btn-numeric v-if="filters.stackSize"
        :filter="filters.stackSize" :name="t('item.stock')" />
      <filter-btn-numeric v-if="filters.whiteSockets"
        :filter="filters.whiteSockets" :name="t('item.white_sockets')" />
      <filter-btn-numeric v-if="filters.gemLevel"
        :filter="filters.gemLevel" :name="t('item.gem_level')" />
      <filter-btn-numeric v-if="filters.quality"
        :filter="filters.quality" :name="t('item.quality')" />
      <template v-if="filters.influences">
        <filter-btn-logical v-for="influence of filters.influences" :key="influence.value"
          :filter="influence" :text="influence.value" :img="`/images/influence-${influence.value}.png`" />
      </template>
      <filter-btn-logical v-if="filters.rarity?.value === 'magic'"
        :filter="filters.rarity" text="Magic" />
      <filter-btn-logical v-if="filters.unidentified"
        :filter="filters.unidentified" :text="t('item.unidentified')" />
      <filter-btn-logical v-if="filters.veiled"
        :filter="filters.veiled" :text="t('item.veiled')" />
      <filter-btn-logical v-if="filters.foil"
        :filter="filters.foil" :text="t('item.foil_unique')" />
      <filter-btn-logical v-if="filters.mirrored && !filters.mirrored.hidden" active
        :filter="filters.mirrored" :text="t(filters.mirrored.disabled ? 'item.not_mirrored' : 'item.mirrored')" />
      <filter-btn-logical v-if="filters.split && !filters.split.hidden" active
        :filter="filters.split" :text="t(filters.split.disabled ? 'item.not_split' : 'item.split')" />
      <filter-btn-logical v-if="hasStats"
        :collapse="statsVisibility.disabled"
        :filter="statsVisibility"
        :active="totalSelectedMods > 0"
        :text="(totalSelectedMods > 0)
          ? t('filters.selected_some', [totalSelectedMods, stats.length])
          : t('filters.selected_none')"
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
          class="border-b border-gray-700 py-2">{{ t('filters.empty') }}</div>
        <template v-if="showUnknownMods">
          <unknown-modifier v-for="stat of item.unknownModifiers" :key="stat.type + '/' + stat.text"
            :stat="stat" />
        </template>
        <input type="submit" class="hidden" />
      </form>
      <div class="flex gap-x-4">
        <button @click="statsVisibility.disabled = !statsVisibility.disabled" class="bg-gray-700 px-2 py-1 text-gray-400 leading-none rounded-b w-40"
          >{{ t('filters.collapse') }} <i class="fas fa-chevron-up pl-1 text-xs text-gray-600"></i></button>
        <ui-toggle v-if="filteredStats.length !== stats.length"
          v-model="showHidden" class="text-gray-400 pt-2">{{ t('filters.hidden_toggle') }}</ui-toggle>
        <ui-toggle
          v-model="showFilterSources" class="ml-auto text-gray-400 pt-2">{{ t('filters.mods_toggle') }}</ui-toggle>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, shallowRef, shallowReactive, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import UiToggle from '@/web/ui/UiToggle.vue'
import FilterModifier from './FilterModifier.vue'
import FilterBtnNumeric from './FilterBtnNumeric.vue'
import FilterBtnLogical from './FilterBtnLogical.vue'
import UnknownModifier from './UnknownModifier.vue'
import { ItemFilters, StatFilter } from './interfaces'
import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { ITEM_BY_TRANSLATED } from '@/assets/data'
import { usePoeninja, displayRounding } from '@/web/background/Prices'

export default defineComponent({
  name: 'FiltersBlock',
  emits: ['submit', 'preset'],
  components: {
    FilterModifier,
    FilterBtnNumeric,
    FilterBtnLogical,
    UnknownModifier,
    UiToggle
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
      props.item.category !== ItemCategory.Sentinel &&
      props.item.category !== ItemCategory.Map
    )

    const { t } = useI18n()
    const { findPriceByQuery, findPriceByName, autoCurrency } = usePoeninja()

    function findItemPrice (name: string) {
      let refName = name
      for (const ns of ['ITEM', 'DIVINATION_CARD', 'UNIQUE'] as const) {
        const found = ITEM_BY_TRANSLATED(ns, name)
        if (found?.length) { refName = found[0].refName; break }
      }
      for (const ns of ['DIVINATION_CARD', 'ITEM']) {
        const result = findPriceByQuery({ ns, name: refName, variant: undefined })
        if (result) return result
      }
      return findPriceByName(refName)
    }

    const sacrificePrice = computed(() => {
      const ult = props.item.ultimatum
      if (!ult) return null
      const result = findItemPrice(ult.sacrifice)
      if (!result) return null
      const amount = ult.sacrificeAmount
      return {
        unit: autoCurrency(result.chaos),
        total: (amount > 1) ? autoCurrency(result.chaos * amount) : null,
        amount,
        url: result.url
      }
    })

    const rewardPrice = computed(() => {
      const ult = props.item.ultimatum
      if (!ult) return null
      const result = findItemPrice(ult.reward)
      if (!result) return null
      return {
        unit: autoCurrency(result.chaos),
        chaos: result.chaos,
        url: result.url
      }
    })

    const ultimatumProfit = computed(() => {
      const ult = props.item.ultimatum
      if (!ult || !sacrificePrice.value) return null

      const sacrificeResult = findItemPrice(ult.sacrifice)
      if (!sacrificeResult) return null
      const sacrificeTotalChaos = sacrificeResult.chaos * ult.sacrificeAmount

      const rewardId = props.filters.ultimatum?.reward.value
      let profitChaos: number

      if (rewardId === 'DoubleDivCards' || rewardId === 'DoubleCurrency') {
        profitChaos = sacrificeTotalChaos
      } else {
        if (!rewardPrice.value) return null
        profitChaos = rewardPrice.value.chaos - sacrificeTotalChaos
      }

      return autoCurrency(profitChaos)
    })

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
      },
      sacrificePrice,
      rewardPrice,
      ultimatumProfit,
      formatPrice (value: number) {
        return displayRounding(value)
      },
      openSacrificeNinja () {
        if (sacrificePrice.value?.url) {
          window.open(sacrificePrice.value.url)
        }
      },
      openRewardNinja () {
        if (rewardPrice.value?.url) {
          window.open(rewardPrice.value.url)
        }
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
