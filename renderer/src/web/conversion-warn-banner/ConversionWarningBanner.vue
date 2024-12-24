<template>
  <div
    class="bg-orange-400 text-gray-900 text-center text-sm font-bold text-shadow-lg"
  >
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
    return {
      t,
    };
  },
});
</script>
