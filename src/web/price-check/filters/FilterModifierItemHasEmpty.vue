<template>
  <div v-if="show" class="flex">
    <button :class="[$style.button, { [$style.selected]: filter.roll === 0 }]"
      @click="select(0)" type="button">{{ t('Any') }}</button>
    <button :class="[$style.button, { [$style.selected]: filter.roll === 1 }]" class="mx-1"
      @click="select(1)" type="button">{{ t('Prefix') }}</button>
    <button :class="[$style.button, { [$style.selected]: filter.roll === 2 }]"
      @click="select(2)" type="button">{{ t('Suffix') }}</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { StatFilter } from './interfaces'

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true
    }
  },
  setup (props) {
    const show = computed(() => {
      return props.filter.tradeId[0] === 'item.has_empty_modifier'
    })

    const { t } = useI18n()

    return {
      t,
      show,
      select (value: number) {
        (props.filter as Writeable<StatFilter>).roll = value
        props.filter.disabled = false
      }
    }
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

<i18n>
{
  "ru": {
    "Any": "Любое",
    "Prefix": "Префикс",
    "Suffix": "Суффикс"
  }
}
</i18n>
