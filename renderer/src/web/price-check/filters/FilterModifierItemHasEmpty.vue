<template>
  <div v-if="options" class="flex gap-x-1">
    <button v-for="option in options"
      :class="[$style.button, { [$style.selected]: option.isSelected }]"
      @click="option.select" type="button">{{ t(option.text) }}</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { StatFilter, ItemHasEmptyModifier } from './interfaces'

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    }
  },
  setup (props) {
    function select (value: ItemHasEmptyModifier) {
      const { filter } = props
      filter.option!.value = value
      filter.disabled = false
    }

    const options = computed(() => {
      const { filter } = props
      if (filter.tradeId[0] !== 'item.has_empty_modifier') return null

      return ([
        [ItemHasEmptyModifier.Any, 'has_empty_affix'],
        [ItemHasEmptyModifier.Prefix, 'has_empty_prefix'],
        [ItemHasEmptyModifier.Suffix, 'has_empty_suffix']
      ] as const).map(([value, text]) => ({
        text,
        select: () => select(value),
        isSelected: (filter.option!.value === value)
      }))
    })

    const { t } = useI18n()
    return { t, options }
  }
})
</script>

<style lang="postcss" module>
.button {
  @apply bg-gray-700;
  @apply rounded;
  @apply px-2;
  @apply border border-transparent;
  line-height: 1.15rem;
}

.selected {
  @apply border-gray-500;
}
</style>
