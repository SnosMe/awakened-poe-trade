<template>
  <div :class="[$style.btn, { [$style.active]: !filter.disabled }]">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">
      {{ name }}
    </button>
    <select
      :class="$style.dropdown"
      v-model="selected"
      @focus="onFocus"
      @change="onChange"
      :disabled="filter.disabled"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, watch } from "vue";

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<{ disabled: boolean; value?: string }>,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    options: {
      type: Array as PropType<Array<{ label: string; value: string }>>,
      required: true,
    },
  },
  setup(props) {
    const selected = ref<string>(props.filter.value || "");

    watch(
      () => props.filter.value,
      (newValue) => {
        selected.value = newValue || "";
      },
      { immediate: true },
    );

    const onFocus = () => {
      props.filter.disabled = false;
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      props.filter.value = target.value;
    };

    return {
      selected,
      onFocus,
      onChange,
    };
  },
});
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

.dropdown {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-500;
}
</style>
