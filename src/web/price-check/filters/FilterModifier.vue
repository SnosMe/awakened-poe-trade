<template>
  <div :class="$style['filter']">
    <div v-if="showSourceInfo" :class="$style['mods']">
      <div class="pl-5 py-1" v-for="(source, idx) of filter.sources" :key="idx">
        <source-info :source="source" :filter="filter" />
      </div>
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <div class="pb-px flex items-baseline justify-between">
        <button class="flex items-baseline text-left min-w-0" @click="toggleFilter" type="button">
          <i class="w-5" :class="{
            'far fa-square text-gray-500': isDisabled,
            'fas fa-check-square': !isDisabled
          }"></i>
          <div class="search-text flex-1 mr-1 relative flex min-w-0" style="line-height: 1rem;">
            <span class="truncate"><item-modifier-text :text="text" :roll="rollValue" /></span>
            <span class="search-text-full whitespace-pre-wrap"><item-modifier-text :text="text" :roll="rollValue" /></span>
          </div>
        </button>
        <div class="flex items-baseline gap-x-1">
          <div v-if="showQ20Notice" :class="$style['qualityLabel']">{{ t('Q {0}%', [calcQuality]) }}</div>
          <div class="flex gap-x-px">
            <input :class="$style['rollInput']" :placeholder="t('min')" :min="rollBounds?.min" :max="rollBounds?.max" :step="changeStep" type="number"
              v-if="showInputs" ref="inputMinEl"
              v-model.number="inputMin" @focus="inputFocus($event, 'min')" @mousewheel.stop>
            <input :class="$style['rollInput']" :placeholder="t('max')" :min="rollBounds?.min" :max="rollBounds?.max" :step="changeStep" type="number"
              v-if="showInputs" ref="inputMaxEl"
              v-model.number="inputMax" @focus="inputFocus($event, 'max')" @mousewheel.stop>
          </div>
        </div>
      </div>
      <div class="flex">
        <div class="w-5 flex items-start">
          <ui-popover v-if="isHidden" tag-name="div" class="flex" placement="right-start" boundary="#price-window">
            <template #target>
              <span class="text-xs leading-none text-gray-600 cursor-pointer">
                <i class="fas fa-eye-slash" :class="{ 'faa-ring': !isDisabled }"></i>
              </span>
            </template>
            <template #content>
              <div style="max-width: 18.5rem;">{{ hiddenReason }}</div>
            </template>
          </ui-popover>
        </div>
        <div class="flex-1 flex items-start">
          <span v-if="showTag"
            :class="[$style['tag'], $style[`tag-${tag}`]]">{{ t(tag) }}</span>
          <filter-modifier-item-has-empty :filter="filter" />
        </div>
        <div v-if="showRollBounds"
          class="mr-4" style="width: 12.5rem;">
          <ui-slider
            class="search-slider-rail" style="padding: 0;" :dotSize="[0, 1.25*fontSize]" :height="1.25*fontSize"
            :railStyle="{ background: 'transparent' }" :processStyle="{ background: '#cbd5e0', borderRadius: 0 }"
            drag-on-click lazy adsorb :enable-cross="false"

            v-model="sliderValue"
            :marks="{
              [rollBounds.min]: { label: 'min' },
              [rollBounds.max]: { label: 'max' },
              [rollValue]: { label: 'roll' }
            }"
            :min="rollBounds.min"
            :max="rollBounds.max"
            :interval="changeStep"
          >
          <template v-slot:mark="{ pos, label, active }">
            <div class="custom-mark" :class="{ active, [label]: true }" :style="{ flex: pos }">
              <div class="custom-mark-tick" :style="{ 'left': `calc(${pos}% - 1px)` }"></div>
              {{ label === 'min' ? rollBounds.min : label === 'max' ? rollBounds.max
                : (rollValue === rollBounds.min || rollValue === rollBounds.max ? rollValue : '') }}
            </div>
          </template>
          </ui-slider>
        </div>
        <div style="width: calc(2*3rem + 1px)"></div>
      </div>
    </div>
    <div class="flex flex-col">
      <modifier-anointment :filter="filter" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, nextTick, ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemModifierText from '../../ui/ItemModifierText.vue'
import ModifierAnointment from './FilterModifierAnointment.vue'
import FilterModifierItemHasEmpty from './FilterModifierItemHasEmpty.vue'
import { AppConfig } from '@/web/Config'
import { ItemRarity, ParsedItem } from '@/parser'
import { FilterTag, StatFilter } from './interfaces'
import SourceInfo from './SourceInfo.vue'

export default defineComponent({
  components: { ItemModifierText, ModifierAnointment, FilterModifierItemHasEmpty, SourceInfo },
  emits: ['submit'],
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    },
    showSources: {
      type: Boolean,
      required: true
    }
  },
  setup (props, ctx) {
    const showTag = computed(() =>
      props.filter.tag !== FilterTag.Property &&
      props.filter.tradeId[0] !== 'item.has_empty_modifier' &&
      props.item.info.refName !== 'Chronicle of Atzoatl' &&
      !(props.item.rarity === ItemRarity.Unique && (
        props.filter.tag === FilterTag.Explicit ||
        props.filter.tag === FilterTag.Pseudo))
    )

    const showQ20Notice = computed(() => {
      return [
        'armour.armour',
        'armour.evasion_rating',
        'armour.energy_shield',
        'armour.ward',
        'weapon.total_dps',
        'weapon.physical_dps'
      ].includes(props.filter.tradeId[0])
    })

    const calcQuality = computed(() => Math.max(20, props.item.quality || 0))

    const inputMinEl = ref<ComponentPublicInstance | null>(null)
    const inputMaxEl = ref<ComponentPublicInstance | null>(null)

    const sliderValue = computed<Array<number>>({
      get () {
        const roll = props.filter.roll!
        return [
          typeof roll.min === 'number' ? roll.min : roll.bounds!.min,
          typeof roll.max === 'number' ? roll.max : roll.bounds!.max
        ]
      },
      set (value) {
        if (props.filter.roll!.min !== value[0]) {
          props.filter.roll!.min = value[0]
          nextTick(() => {
            (inputMinEl.value!.$el as HTMLInputElement).focus()
          })
        } else if (props.filter.roll!.max !== value[1]) {
          props.filter.roll!.max = value[1]
          nextTick(() => {
            (inputMaxEl.value!.$el as HTMLInputElement).focus()
          })
        }
        props.filter.disabled = false
      }
    })

    function inputFocus (e: FocusEvent, type: 'min' | 'max') {
      const target = e.target as HTMLInputElement
      if (target.value === '') {
        if (type === 'max') {
          props.filter.roll!.max = props.filter.roll!.default.max
        } else if (type === 'min') {
          props.filter.roll!.min = props.filter.roll!.default.min
        }
        nextTick(() => {
          target.select()
        })
      } else {
        target.select()
      }
      props.filter.disabled = false
    }

    function toggleFilter (e: MouseEvent) {
      if (e.detail === 0) {
        ctx.emit('submit')
      } else {
        props.filter.disabled = !props.filter.disabled
      }
    }

    const { t } = useI18n()

    return {
      t,
      showTag,
      showQ20Notice,
      calcQuality,
      inputMinEl,
      inputMaxEl,
      sliderValue,
      inputMin: computed({
        get (): any { return props.filter.roll!.min },
        set (value: '' | number) { props.filter.roll!.min = value }
      }),
      inputMax: computed({
        get (): any { return props.filter.roll!.max },
        set (value: '' | number) { props.filter.roll!.max = value }
      }),
      tag: computed(() => props.filter.tag),
      // TODO: change
      changeStep: computed(() => props.filter.roll!.dp ? 0.01 : 1),
      showInputs: computed(() => props.filter.roll != null),
      fontSize: computed(() => AppConfig().fontSize),
      isDisabled: computed(() => props.filter.disabled),
      text: computed(() => t(props.filter.text)),
      rollValue: computed(() => props.filter.roll?.value),
      rollBounds: computed(() => props.filter.roll?.bounds),
      showRollBounds: computed(() => props.filter.roll?.bounds != null),
      isHidden: computed(() => props.filter.hidden != null),
      hiddenReason: computed(() => t(props.filter.hidden!)),
      showSourceInfo: computed(() =>
        props.showSources &&
        props.filter.sources.length &&
        props.filter.option == null && (
          props.filter.tag === FilterTag.Pseudo ||
          (
            props.filter.sources.length >= 2 ||
            props.filter.sources[0].modifier.info.name != null ||
            props.filter.sources[0].modifier.info.tier != null ||
            props.filter.sources[0].modifier.info.rank != null
          )
        )),
      inputFocus,
      toggleFilter
    }
  }
})
</script>

<style lang="postcss" module>
.filter {
  @apply py-2;
  @apply border-b border-gray-700;
  display: flex;
  position: relative;
}

.rollInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-12;
  @apply px-1;
  @apply border border-transparent;

  &:first-child { @apply rounded-l; }
  &:last-child { @apply rounded-r; }

  &::placeholder {
    @apply text-gray-700;
    font-size: 0.8125rem;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
    cursor: none;
  }
}

.qualityLabel {
  @apply text-gray-500;
  @apply border border-gray-700;
  @apply rounded;
  @apply px-2;
  text-align: center;
}

.mods {
  @apply border-b-4 border-gray-500;
  background: linear-gradient(to bottom, theme('colors.gray.800') , theme('colors.gray.900') );
  @apply -mx-4 px-4;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
}

.filter:not(:hover) > .mods {
  display: none;
}

.filter:nth-child(4) > .mods {
  display: block;
}

.tag {
  @apply px-1;
  @apply rounded;
  @apply text-xs;
  line-height: 1;
}
.tag-variant {
  @apply bg-yellow-700 text-yellow-100; }
.tag-eldritch {
  background: linear-gradient(to right, theme('colors.red.700'), theme('colors.blue.700'));
}
.tag-corrupted {
  @apply bg-red-700 text-red-100; }
.tag-fractured {
  @apply bg-yellow-400 text-black; }
.tag-crafted, .tag-synthesised {
  @apply bg-blue-600 text-blue-100; }
.tag-implicit, .tag-explicit {
  @apply -mx-1 text-gray-600; }
.tag-scourge {
  @apply bg-orange-600 text-white; }
.tag-enchant {
  @apply bg-purple-600 text-purple-100; }
.tag-pseudo {
  @apply bg-gray-700 text-gray-900; }
</style>

<style lang="postcss">
.search-text-full {
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  padding-bottom: 1px;
  z-index: 10;

  .search-text:not(:hover) & {
    display: none;
  }

  .search-text:hover & {
    @apply bg-gray-700;
  }
}

.search-slider-rail { @apply rounded bg-gray-700; }
.vue-slider-marks { display: flex; }
.vue-slider-dot-tooltip-inner {
  font-size: 0.875rem;
  padding: 0.125rem 0.3125rem;
  min-width: 1.25rem;
  border-radius: 0.25rem;

  &::after {
    border-width: 0.3125rem;
  }
}
.custom-mark {
  text-align: right;
  white-space: nowrap;
  @apply px-1;
  @apply text-gray-500;

  &.active {
    z-index: 1;
    @apply text-gray-900;
  }

  &.roll .custom-mark-tick {
    position: absolute;
    height: 100%;

    &::before, &::after {
      content: ' ';
      display: block;
      position: absolute;
      height: 0.25rem;
      width: 0.125rem;
      @apply bg-gray-900;
    }

    &::before { top: 0; }
    &::after { bottom: 0; }
  }
}
</style>

<i18n>
{
  "ru": {
    "Q {0}%": "К-во: {0}%",
    "DPS: #": "ДПС: #",
    "Elemental DPS: #": "Стихийный ДПС: #",
    "Physical DPS: #": "Физический ДПС: #",
    "Attacks per Second: #": "Атак в секунду: #",
    "Critical Strike Chance: #%": "Шанс критического удара: #%",
    "Armour: #": "Броня: #",
    "Evasion Rating: #": "Уклонение: #",
    "Energy Shield: #": "Энерг. щит: #",
    "Ward: #": "Барьер: #",
    "Block: #%": "Блок: #%",
    "variant": "вариант",
    "corrupted": "осквернено",
    "synthesised": "синтезирован",
    "eldritch": "зловещий",
    "pseudo": "псевдо",
    "Roll is not variable": "Ролл не варьируется",
    "Elemental damage is not the main source of DPS": "Стихийный урон не основной источник ДПСа",
    "Physical damage is not the main source of DPS": "Физический урон не основной источник ДПСа",
    "Filtering by exact Elemental Resistance unreasonably increases the price": "Поиск по точному виду сопротивления необоснованно увеличивает цену",
    "Crafted Chaos Resistance without Explicit mod has no value": "Крафтовое сопротивление хаосу без \"родного\" свойства не имеет ценности",
    "Buyer will likely change anointment": "Покупатель, скорее всего, поменяет зачарование",
    "Select only if price-checking as base item for crafting": "Отмечайте, если проверяете цену в качестве базового предмета для крафта",
    "1 Empty or Crafted Modifier": "1 свободное или ремесленное свойство",
    "Select only if item has 6 modifiers (1 of which is crafted) or if it has 5 modifiers": "Выбирайте, только если у предмета 6 свойств (1 из которых ремесленное) или если у него 5 свойств",
    "First ask yourself: would you buy an item with this stat?": "Сначала спросите себя: купили бы вы предмет с этим модом?"
  }
}
</i18n>
