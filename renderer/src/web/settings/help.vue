<template>
  <div class="max-w-md p-2 h-full flex flex-col justify-between">
    <div>
      <div class="mb-4">
        <div class="flex-1 mb-1">{{ t(":show_tips_frequency") }}</div>
        <select v-model="tipsFrequency" class="p-1 rounded bg-gray-700 w-24">
          <option :value="1">{{ t(":tip_frequency_1") }}</option>
          <option :value="2">{{ t(":tip_frequency_2") }}</option>
          <option :value="3">{{ t(":tip_frequency_3") }}</option>
          <option :value="4">{{ t(":tip_frequency_4") }}</option>
          <option :value="5">{{ t(":tip_frequency_5") }}</option>
          <option :value="6">{{ t(":tip_frequency_6") }}</option>
        </select>
      </div>
    </div>
    <div class="mt-auto">
      <div class="mb-4 text-xl border-b border-double">
        {{ t(":tips_header") }}
      </div>
      <div class="flex flex-row gap-2">
        <button
          class="btn flex items-center justify-center p-2"
          @click="showPrev"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <tip :selected="currentTip" />
        <button
          class="btn flex items-center justify-center p-2"
          @click="showNext"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useI18nNs } from "@/web/i18n";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { configModelValue, configProp } from "./utils";
import Tip from "../help/Tip.vue";
import { TIP_COUNT } from "../help/tips";

export default defineComponent({
  name: "settings.help",
  components: { UiCheckbox, Tip },
  props: configProp(),
  setup(props) {
    const { t } = useI18nNs("settings");
    const currentTip = ref(1);
    const showNext = () => {
      currentTip.value += 1;
      if (currentTip.value > TIP_COUNT) {
        currentTip.value = 1;
      }
    };
    const showPrev = () => {
      currentTip.value -= 1;
      if (currentTip.value < 1) {
        currentTip.value = TIP_COUNT;
      }
    };

    return {
      t,
      tipsFrequency: configModelValue(() => props.config, "tipsFrequency"),
      currentTip,
      showNext,
      showPrev,
    };
  },
});
</script>
