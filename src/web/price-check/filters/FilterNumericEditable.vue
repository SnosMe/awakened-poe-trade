<template>
  <div :class="[$style.btn, { [$style.active]: !filter.disabled }]">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">{{ t(name) }}</button>
    <input :class="$style.input" step="any" type="number"
      v-model.number="inputMin"
      @focus="inputFocus"
      @blur="inputMinBlur"
      @mousewheel.stop
      :style="{ width: `${1.2 + Math.max(String(inputMin).length, 2)}ch` }"
    />
    <!-- <template v-if="">
      <span>–</span>
      <input input :class="$style.input" step="any" type="number">
    </template> -->
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
      inputFocus (e: InputEvent) {
        const target = e.target as HTMLInputElement
        target.select()
        props.filter.disabled = false
      },
      inputMinBlur () {
        if (typeof _inputMin.value !== 'number') {
          _inputMin.value = 0
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
    "Level:": "Уровень:"
  }
}
</i18n>
