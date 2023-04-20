<template>
  <button :class="[$style.btn, { [$style.active]: (active != null) ? active : !filter.disabled }]"
    @click="toggle"
  >
    <img v-if="img" :src="img" class="w-5 h-5">
    <span class="pl-1">{{ t(text) }}</span>
    <i v-if="collapse" class="pl-2 text-xs text-gray-400"
      :class="filter.disabled ? 'fas fa-chevron-down' : 'fas fa-chevron-up'" />
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  emits: [], // mutates filter
  props: {
    filter: {
      type: Object as PropType<{ disabled: boolean }>,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    img: {
      type: String,
      default: undefined
    },
    readonly: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: undefined
    },
    collapse: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    const { t } = useI18n()
    return {
      t,
      toggle () {
        const { filter, readonly } = props
        if (!readonly) {
          filter.disabled = !filter.disabled
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
  @apply pl-1 pr-2;
  line-height: 1.25rem;
  display: flex;
  align-items: center;

  &.active {
    @apply border-gray-500;
  }
}
</style>
