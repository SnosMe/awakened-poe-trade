<template>
  <div :class="$style.box">
    <h4 class="text-red-400">
      <slot name="name">Error comes here.</slot>
    </h4>
    <slot />
    <div v-if="$slots.actions" :class="$style.actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UiErrorBox",
});
</script>

<style lang="postcss" module>
.box {
  @apply border border-red-400;
  @apply rounded;
  @apply px-4 py-2;
  @apply flex flex-col gap-y-1;
}

.actions {
  @apply flex gap-x-1 justify-end;

  & button {
    min-width: 4rem;
  }
}
</style>
