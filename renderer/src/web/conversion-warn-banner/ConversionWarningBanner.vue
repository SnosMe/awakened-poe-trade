<template>
  <div class="bg-orange-400 text-gray-900 text-center text-sm font-bold">
    {{ t("poe2_new.beta_warning") }}
    <br />
    {{ t("poe2_new.beta_warning2") }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const devMode = !!process.env.NODE_ENV;
    return {
      t,
      devMode,
    };
  },
});
</script>

<style lang="postcss" module>
.dev {
  @apply text-black text-center text-sm font-bold;

  background: repeating-linear-gradient(
    45deg,
    #6d31ce,
    #6d31ce 8px,
    #276749 8px,
    #276749 24px
  );
}
</style>
