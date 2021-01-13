<template>
  <div v-if="filter"
    class="trade-tag trade-tag--box flex" :class="{ disabled: filter.disabled }">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">{{ t(name) }}</button>
    <ui-input-debounced class="trade-tag__input" step="any" type="number"
      v-model.number="filterValue"
      :placeholder="filter.value"
      :delay="0"
      @focus="inputFocus"
      :style="{ width: `${1.2 + String(filterValue).length}ch` }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FilterNumeric } from './interfaces'

export default defineComponent({
  emits: [], // mutates filter
  props: {
    filter: {
      type: Object as PropType<FilterNumeric | undefined>,
      default: undefined
    },
    name: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const filterValue = computed({
      get () {
        return props.filter!.value
      },
      set (value) {
        if (typeof value === 'number') {
          props.filter!.value = value
          props.filter!.disabled = false
        } else {
          props.filter!.disabled = true
        }
      }
    })

    function inputFocus (e: InputEvent) {
      const target = e.target as HTMLInputElement

      if (target.value === '') {
        target.value = String(props.filter!.value)
      }
      target.select()
      props.filter!.disabled = false
    }

    const { t } = useI18n()

    return {
      t,
      filterValue,
      inputFocus
    }
  }
})
</script>

<style lang="postcss">
.trade-tag__input {
  @apply text-center;
  @apply mr-1;
  @apply bg-transparent;
  @apply text-gray-300;
  @apply select-all;

  &:hover,
  &:focus {
    @apply bg-gray-700;
    @apply -my-px;
    @apply border-t border-b border-gray-500;
  }

  &::placeholder {
    @apply text-gray-300;
  }

  &:focus::placeholder {
    color: transparent;
  }

  &:focus { cursor: none; }
}
</style>

<i18n>
{
  "ru": {
    "Item Level:": "Ур. предмета:",
    "Stock:": "Запаc:"
  }
}
</i18n>
