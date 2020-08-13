<template>
  <div v-if="filter"
    class="trade-tag trade-tag--box flex" :class="{ disabled: filter.disabled }">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">{{ $t(name) }}</button>
    <ui-input-debounced class="trade-tag__input" :placeholder="filter.value" step="any" type="number"
      v-model.number="filterValue" :delay="577" />
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
  }
}
</script>

<style lang="postcss">
.trade-tag__input {
  @apply text-center;
  @apply w-6;
  @apply mr-1;
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply select-all;

  &:hover,
  &:focus {
    @apply bg-gray-700;
    @apply -my-px;
    @apply border-t border-b border-gray-500;
  }

  &::placeholder {
    @apply text-gray-700;
  }
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
