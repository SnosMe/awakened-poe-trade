<template>
  <div v-if="filter"
    class="trade-tag trade-tag--box flex" :class="{ disabled: filter.disabled }">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">{{ $t(name) }}</button>
    <ui-input-debounced class="trade-tag__input" step="any" type="number"
      v-model.number="filterValue"
      :placeholder="filter.value"
      :delay="0"
      @focus.native="inputFocus"
      :style="`width: ${1.2 + String(filterValue).length}ch`" />
  </div>
</template>

<script>
export default {
  props: {
    filter: {
      type: Object,
      default: undefined
    },
    name: {
      type: String,
      required: true
    }
  },
  computed: {
    filterValue: {
      get () {
        return this.filter.value
      },
      set (value) {
        if (typeof value === 'number') {
          this.filter.value = value
          this.filter.disabled = false
        } else {
          this.filter.disabled = true
        }
      }
    }
  },
  methods: {
    inputFocus (e) {
      if (e.target.value === '') {
        e.target.value = this.filter.value
      }
      e.target.select()
      this.filter.disabled = false
    }
  }
}
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
