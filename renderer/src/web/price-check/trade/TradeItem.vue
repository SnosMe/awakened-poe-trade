<template>
  <!-- Render nothing directly, all behavior is applied to the element passed via ref -->
  <tr
    ref="target"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <td class="px-2 whitespace-nowrap">
      <span
        :class="{
          'line-through': result.priceCurrency === 'chaos',
        }"
        >{{ result.priceAmount }} {{ result.priceCurrency }}</span
      >
      <span
        v-if="result.listedTimes > 2"
        class="rounded px-1 text-gray-800 bg-gray-400 -mr-2"
        ><span class="font-sans">×</span> {{ result.listedTimes }}</span
      ><i v-else-if="!result.hasNote" class="fas fa-question" />
    </td>
    <td v-if="item.stackSize" class="px-2 text-right">
      {{ result.stackSize }}
    </td>
    <td v-if="itemLevel" class="px-2 whitespace-nowrap text-right">
      {{ result.itemLevel }}
    </td>
    <td v-if="item.category === 'Gem'" class="pl-2 whitespace-nowrap">
      {{ result.level }}
    </td>
    <td v-if="item.category === 'Gem'" class="pl-2 whitespace-nowrap">
      {{ result.gemSockets }}
    </td>
    <td
      v-if="quality || item.category === 'Gem'"
      class="px-2 whitespace-nowrap text-blue-400 text-right"
    >
      {{ result.quality }}
    </td>
    <td class="pr-2 pl-4 whitespace-nowrap">
      <div class="inline-flex items-center">
        <div class="account-status" :class="result.accountStatus"></div>
        <div class="ml-1 font-sans text-xs">
          {{ result.relativeDate }}
        </div>
      </div>
      <span
        v-if="!showSeller && result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400 ml-1"
        >{{ t("You") }}</span
      >
    </td>
    <td v-if="showSeller" class="px-2 whitespace-nowrap">
      <span
        v-if="result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400"
        >{{ t("You") }}</span
      >
      <span v-else class="font-sans text-xs">{{
        showSeller === "ign" ? result.ign : result.accountName
      }}</span>
    </td>
  </tr>
</template>

<script lang="ts">
import {
  computed,
  createApp,
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
} from "vue";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import { PricingResult } from "./pathofexile-trade";
import { ParsedItem } from "@/parser/ParsedItem";
import { FilterNumeric } from "../filters/interfaces";
import { useI18nNs } from "@/web/i18n";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import TooltipItem from "./TooltipItem.vue";
import tippy, { Instance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import { AppConfig } from "@/web/Config";

export default defineComponent({
  name: "TradeItem",
  props: {
    result: {
      type: Object as PropType<
        PricingResult & {
          listedTimes: number;
        }
      >,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    showSeller: {
      type: [Boolean, String] as PropType<PriceCheckWidget["showSeller"]>,
      default: undefined,
    },
    itemLevel: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
    quality: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
  },

  setup(props) {
    const tooltipOption = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.itemHoverTooltip,
    );
    const target = ref<HTMLElement>(null!);
    const { t } = useI18nNs("trade_result");
    let instance: Instance;
    // Shift Key Detection
    const isShiftPressed = ref(false);
    const isHovered = ref(false); // Track hover state

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.enable();
        if (isHovered.value) {
          instance.show();
        }
        isShiftPressed.value = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        instance.hide();
        instance.disable();
        isShiftPressed.value = false;
      }
    };

    onMounted(() => {
      if (tooltipOption.value === "off") return;
      if (tooltipOption.value === "keybind") {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
      }

      // tippy stuff
      instance = tippy(target.value, {
        interactive: true,
        theme: "light",
        trigger: undefined,
        placement: "left",
        arrow: true,
        delay: [0, 0],
        animation: false,
        maxWidth: "none",
        onShow() {
          const app = createApp(TooltipItem, {
            result: props.result,
          });
          const tooltipContainer = document.createElement("div");
          app.mount(tooltipContainer);
          instance.setContent(tooltipContainer);
        },
      });
      if (tooltipOption.value === "keybind") {
        instance.disable();
      }
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      // tippy stuff
      instance.destroy();
    });
    return {
      t,
      target,
      isHovered,
      isShiftPressed,
    };
  },
});
</script>

<style lang="postcss">
.tippy-box {
  @apply rounded;
}

.tippy-content {
  @apply p-1;
}
</style>
