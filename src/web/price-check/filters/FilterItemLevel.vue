<template>
  <div v-if="filters.itemLevel"
    class="trade-tag trade-tag--box flex" :class="{ disabled: filters.itemLevel.disabled }">
    <button @click="filters.itemLevel.disabled = !filters.itemLevel.disabled" class="pl-2">{{ $t('Item Level:') }}</button>
    <ui-input-debounced class="trade-tag__input" placeholder="1" step="any" type="number"
      v-model.number="ilvl" :delay="577" />
  </div>
</template>

<script>
export default {
  props: {
    filters: {
      type: Object,
      required: true
    }
  },
  computed: {
    ilvl: {
      get () {
        return this.filters.itemLevel.value
      },
      set (value) {
        if (typeof value === 'number') {
          this.filters.itemLevel.value = value
          this.filters.itemLevel.disabled = false
        } else {
          this.filters.itemLevel.disabled = true
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

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
}
</style>

<i18n>
{
  "ru": {
    "Item Level:": "Ур. предмета:"
  }
}
</i18n>
