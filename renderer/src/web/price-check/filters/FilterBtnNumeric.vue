<template>
  <div :class="[$style.btn, { [$style.active]: !filter.disabled }]">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">{{ t(name) }}</button>
    <input :class="$style.input" step="any" type="number"
      v-model.number="inputMin"
      @focus="inputFocus"
      @blur="inputMinBlur"
      @mousewheel.stop
      :style="{ width: `${1.2 + Math.max(String(inputMin).length, 2)}ch` }"
    >
    <template v-if="'max' in filter">
      <span>–</span>
      <input :class="$style.input" step="any" type="number"
        v-model.number="inputMax"
        @focus="inputFocus"
        @mousewheel.stop
        :style="{ width: `${1.2 + Math.max(String(inputMax).length, 2)}ch` }"
        placeholder="…"
      >
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FilterNumeric } from './interfaces'

export default defineComponent({
  emits: [], // mutates filter
  props: {
    filter: {
      type: Object as PropType<FilterNumeric>,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const _inputMin = ref<number | ''>('')
    watch(() => props.filter, (filter) => {
      _inputMin.value = filter.value
    }, { immediate: true })

    const _inputMax = ref<number | ''>('')
    watch(() => props.filter, (filter) => {
      _inputMax.value = filter.max ?? ''
    }, { immediate: true })

    const { t } = useI18n()

    return {
      t,
      inputMin: computed<number | ''>({
        get () { return _inputMin.value },
        set (value) {
          _inputMin.value = value
          if (typeof value === 'number') {
            props.filter.value = value
          } else {
            props.filter.value = 0
          }
        }
      }),
      inputMax: computed<number | ''>({
        get () { return _inputMax.value },
        set (value) {
          _inputMax.value = value
          if (typeof value === 'number') {
            props.filter.max = value
          } else {
            props.filter.max = undefined
          }
        }
      }),
      inputFocus (e: FocusEvent) {
        const target = e.target as HTMLInputElement
        target.select()
        props.filter.disabled = false
      },
      inputMinBlur () {
        if (typeof _inputMin.value !== 'number') {
          _inputMin.value = 0
          props.filter.disabled = true
        }
      }
    }
  }
})
</script>

<style lang="postcss" module>
.btn {
  @apply bg-gray-900 rounded;
  @apply border border-transparent;
  @apply pr-1;
  line-height: 1.25rem;

  &.active {
    @apply border-gray-500;
  }
}

.input {
  @apply text-center;
  @apply bg-transparent;
  @apply text-gray-300;
  @apply select-all;

  &:hover,
  &:focus {
    @apply bg-gray-700;
    @apply -my-px border-t border-b border-gray-500;
  }

  &::placeholder {
    @apply text-gray-400;
  }

  &:focus { cursor: none; }
}
</style>

<i18n>
{
  "ru": {
    "Item Level:": "Ур. предмета:",
    "Stock:": "Запаc:",
    "Map Tier:": "Ур. карты:",
    "Area Level:": "Ур. области:",
    "Wings Revealed:": "Крыльев обнаружено:",
    "Links:": "Связи:",
    "White:": "Белые:",
    "Quality:": "Качество:",
    "Level:": "Уровень:",
    "Charge:": "Заряд:"
  },
  "cmn-Hant": {
    "Item Level:": "物品等級:",
    "Stock:": "堆疊數量:",
    "Map Tier:": "地圖階級:",
    "Area Level:": "地區等級:",
    "Wings Revealed:": "展翅:",
    "Links:": "連線:",
    "White:": "白:",
    "Quality:": "品質:",
    "Level:": "等級:",
    "Charge:": "充能:"
  },
  "zh_CN": {
    "Item Level:": "物品等级:",
    "Stock:": "堆叠数量:",
    "Map Tier:": "地图等阶:",
    "Area Level:": "地区等级:",
    "Wings Revealed:": "侧厅解锁:",
    "Links:": "链接:",
    "White:": "白孔:",
    "Quality:": "品质:",
    "Level:": "等级:",
    "Charge:": "充能:"
  }
}
</i18n>
