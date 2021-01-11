<template>
  <div class="py-2 border-b border-gray-700">
    <div class="pb-px flex items-baseline justify-between">
      <button class="flex items-baseline text-left min-w-0" @click="toggleFilter" type="button">
        <i class="w-5" :class="{
          'far fa-square text-gray-500': filter.disabled,
          'fas fa-check-square': !filter.disabled
        }"></i>
        <div class="search-text flex-1 mr-1 relative flex min-w-0" style="line-height: 1rem;">
          <span class="truncate whitespace-pre-wrap"><item-modifier-text :text="$t(filter.text)" :roll="filter.roll" /></span>
          <span class="search-text-full whitespace-pre-wrap"><item-modifier-text :text="$t(filter.text)" :roll="filter.roll" /></span>
        </div>
      </button>
      <div class="flex">
        <ui-input-debounced class="search-num-input rounded-tl mr-px" :placeholder="$t('min')" :min="filter.boundMin" :max="filter.boundMax" step="any" type="number" :class="{ 'rounded-bl': !showQ20Notice }"
          v-if="showMinmaxInput" ref="inputMin"
          v-model.number="filter.min" @focus="inputFocus($event, 'min')" :delay="0" />
        <ui-input-debounced class="search-num-input rounded-tr" :placeholder="$t('max')" :min="filter.boundMin" :max="filter.boundMax" step="any" type="number" :class="{ 'rounded-br': !showQ20Notice }"
          v-if="showMinmaxInput" ref="inputMax"
          v-model.number="filter.max" @focus="inputFocus($event, 'max')" :delay="0" />
      </div>
    </div>
    <div class="flex">
      <div class="w-5 flex items-start">
        <ui-popover v-if="filter.hidden" placement="right-start" boundary="#price-window">
          <template #target>
            <span class="text-xs leading-none text-gray-600 cursor-pointer">
              <i class="fas fa-eye-slash" :class="{ 'faa-ring': !filter.disabled }"></i>
            </span>
          </template>
          <template #content>
            <div style="max-width: 18.5rem;">{{ $t(filter.hidden) }}</div>
          </template>
        </ui-popover>
      </div>
      <div class="flex-1 flex items-start">
        <span v-if="showTypeTags"
          class="text-xs leading-none px-1 rounded" :class="`mod-type-${filter.type}`">{{ $t(filter.type) }}</span>
        <span v-if="filter.variant"
          class="text-xs leading-none px-1 rounded mod-type-variant">{{ $t('variant') }}</span>
      </div>
      <div class="flex-1 mr-4">
        <div style="width: 12.5rem;">
          <ui-slider v-if="filter.boundMin !== undefined"
            class="search-slider-rail" style="padding: 0;" :dotSize="[0, 1.25*fontSize]" :height="1.25*fontSize"
            :railStyle="{ background: 'transparent' }" :processStyle="{ background: '#cbd5e0', borderRadius: 0 }"
            drag-on-click lazy adsorb :enable-cross="false"

            v-model="sliderValue"
            :marks="{
              [filter.boundMin]: { label: 'min' },
              [filter.boundMax]: { label: 'max' },
              [filter.roll]: { label: 'roll' }
            }"
            :min="filter.boundMin"
            :max="filter.boundMax"
            :interval="(filter.boundMax - filter.boundMin) < 1 ? 0.01 : 1"
          >
          <template v-slot:mark="{ pos, label, active }">
            <div class="custom-mark" :class="{ active, [label]: true }" :style="{ flex: pos }">
              <div class="custom-mark-tick" :style="{ 'left': `calc(${pos}% - 1px)` }"></div>
              {{ label === 'min' ? filter.boundMin : label === 'max' ? filter.boundMax
                : (filter.roll === filter.boundMin || filter.roll === filter.boundMax ? filter.roll : '') }}
            </div>
          </template>
          </ui-slider>
        </div>
      </div>
      <div v-if="showQ20Notice"
        class="bg-gray-700 text-gray-500 text-center rounded-b" style="width: calc(2*3rem + 1px)">{{ $t('Q {0}%', [Math.max(20, item.quality || 0)]) }}</div>
      <div v-else style="width: calc(2*3rem + 1px)"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, nextTick, ComponentPublicInstance } from 'vue'
import ItemModifierText from '../../ui/ItemModifierText.vue'
import { Config } from '@/web/Config'
import { ParsedItem } from '@/parser'
import { StatFilter } from './interfaces'

export default defineComponent({
  components: { ItemModifierText },
  emits: ['submit'],
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props, ctx) {
    const showMinmaxInput = computed(() => {
      if (
        props.filter.option != null ||
        (props.filter.roll == null && props.filter.min == null && props.filter.max == null)
      ) return false

      return true
    })

    const showTypeTags = computed(() => {
      if (props.filter.boundMin !== undefined || props.filter.variant) {
        return false
      }
      return props.filter.type !== 'armour' &&
        props.filter.type !== 'weapon'
    })

    const showQ20Notice = computed(() => {
      return [
        'armour.armour',
        'armour.evasion_rating',
        'armour.energy_shield',
        'weapon.total_dps',
        'weapon.physical_dps'
      ].includes(props.filter.tradeId[0])
    })

    const inputMin = ref<ComponentPublicInstance | null>(null)
    const inputMax = ref<ComponentPublicInstance | null>(null)

    const sliderValue = computed<Array<number>>({
      get () {
        return [
          typeof props.filter.min === 'number' ? props.filter.min : props.filter.boundMin!,
          typeof props.filter.max === 'number' ? props.filter.max : props.filter.boundMax!
        ]
      },
      set (value) {
        if (props.filter.min !== value[0]) {
          props.filter.min = value[0]
          nextTick(() => {
            (inputMin.value!.$el as HTMLInputElement).focus()
          })
        } else if (props.filter.max !== value[1]) {
          props.filter.max = value[1]
          nextTick(() => {
            (inputMax.value!.$el as HTMLInputElement).focus()
          })
        }
        props.filter.disabled = false
      }
    })

    function inputFocus (e: FocusEvent, type: 'min' | 'max') {
      const target = e.target as HTMLInputElement
      if (target.value === '') {
        if (type === 'max') {
          props.filter.max = props.filter.defaultMax
        } else if (type === 'min') {
          props.filter.min = props.filter.defaultMin
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

    return {
      showMinmaxInput,
      showTypeTags,
      showQ20Notice,
      inputMin,
      inputMax,
      sliderValue,
      fontSize: computed(() => Config.store.fontSize),
      inputFocus
    }
  }
})
</script>

<style lang="postcss">
.mod-type-implicit, .mod-type-variant {
  @apply bg-yellow-700 text-yellow-100
}

.mod-type-crafted {
  @apply bg-blue-600 text-blue-100
}

.mod-type-explicit {
  @apply -mx-1 text-gray-600
}

.mod-type-enchant {
  @apply bg-purple-600 text-purple-100
}

.mod-type-pseudo {
  @apply bg-gray-700 text-gray-900
}

.search-num-input {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-12;
  @apply px-1;
  @apply border border-transparent;

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

.search-text-full {
  position: absolute;
  left: 0px;
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
    "+#% total to one of Elemental Resistances": "Всего +#% к сопротивлению одной из стихий",
    "Map is not occupied by Elder Guardian": "Карта не захвачена Хранителем Древнего",
    "Block: #%": "Блок: #%",
    "variant": "вариант",
    "pseudo": "псевдо",
    "implicit": "собственное",
    "explicit": "свойство",
    "enchant": "зачарование",
    "crafted": "мастер",
    "Roll is not variable": "Ролл не варьируется",
    "Elemental damage is not the main source of DPS": "Стихийный урон не основной источник ДПСа",
    "Physical damage is not the main source of DPS": "Физический урон не основной источник ДПСа",
    "Filtering by exact Elemental Resistance unreasonably increases the price": "Поиск по точному виду сопротивления необоснованно увеличивает цену",
    "Crafted Chaos Resistance without Explicit mod has no value": "Крафтовое сопротивление хаосу без \"родного\" свойства не имеет ценности",
    "Contributes to the item property": "Вносит вклад в параметр предмета",
    "Hidden for sake of familiar view of item stats": "Скрыт ради привычного просмотра свойств предмета"
  }
}
</i18n>
