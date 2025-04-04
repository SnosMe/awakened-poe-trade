<template>
  <div
    class="hover:bg-gray-700 rounded flex items-center overflow-hidden px-1"
    :class="[itemEditorOptions.value === refName ? 'border bg-gray-900' : '']"
    @click="select()"
  >
    <div class="flex items-center justify-center shrink-0 w-8 h-8">
      <slot>
        <img
          :src="icon == '%NOT_FOUND%' ? '/images/404.png' : icon"
          class="max-w-full max-h-full"
        />
      </slot>
    </div>
    <div class="mb-1 cursor-pointer pl-1">
      <div class="text-left text-gray-600 whitespace-nowrap">
        {{ name }}
      </div>
      <div class="text-left whitespace-nowrap">
        {{ displayString }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  emits: ["update:modelValue"],
  props: {
    icon: {
      type: String,
      default: "/images/404.png",
    },
    name: {
      type: String,
      required: true,
    },
    refName: {
      type: String,
      required: true,
    },
    displayString: {
      type: String,
      default: "",
    },
    itemEditorOptions: {
      type: Object as PropType<{ editing: boolean; value: string }>,
      required: true,
    },
  },
  setup(props) {
    return {
      select() {
        props.itemEditorOptions.value = props.refName;
      },
    };
  },
});
</script>
