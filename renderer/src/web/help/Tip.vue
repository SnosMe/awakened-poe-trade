<template>
  <div class="mt-auto border border-dashed p-2 w-full">
    <div class="text-lg font-bold border-b mb-2">
      {{ t("settings.tip_number_header", [tipNumber]) }}
    </div>
    <div>{{ tipText }}</div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import { randomTip } from "./tips";

export default defineComponent({
  name: "help.tip",
  props: {
    selected: {
      type: Number,
    },
  },

  setup(props) {
    const { t } = useI18n();
    const tipNumber = computed(() => props.selected ?? randomTip());

    return {
      t,
      tipNumber,
      tipText: computed(() => t(`tips.tip_${tipNumber.value}`)),
    };
  },
});
</script>
