<template>
  <ui-popover
    :delay="[80, null]"
    placement="bottom-start"
    boundary="#price-window"
  >
    <template #target>
      <button
        class="rounded mr-1 px-2 truncate"
        :class="showWarning() ? 'text-orange-500' : 'text-gray-500'"
      >
        <span
          ><i class="fas fa-history"></i>
          {{ t(filters.trade.offline ? "Offline" : "Online") }}</span
        >
        <span v-if="showLeagueName()">, {{ filters.trade.league }}</span>
      </button>
    </template>
    <template #content>
      <div class="flex gap-x-8 p-2 bg-gray-800 text-gray-400">
        <div class="flex flex-col gap-y-1">
          <div class="mb-1">
            <ui-toggle
              :modelValue="filters.trade.offline"
              @update:modelValue="onOfflineUpdate"
              >{{ t(":offline_toggle") }}</ui-toggle
            >
          </div>
          <template v-if="byTime">
            <ui-radio v-model="filters.trade.listed" :value="undefined">{{
              t(":listed_any_time")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="1day">{{
              t(":listed_1day")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="3days">{{
              t(":listed_3days")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="1week">{{
              t(":listed_1week")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="2weeks">{{
              t(":listed_2weeks")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="1month">{{
              t(":listed_1month")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.listed" value="2months">{{
              t(":listed_2months")
            }}</ui-radio>
          </template>
        </div>
        <div class="flex flex-col gap-y-1">
          <div class="mb-1">
            <ui-toggle
              :class="{ invisible: filters.trade.offline }"
              v-model="filters.trade.onlineInLeague"
              >{{ t(":in_league_toggle") }}</ui-toggle
            >
          </div>
          <ui-radio
            v-for="league of tradeLeagues"
            :key="league.id"
            v-model="filters.trade.league"
            :value="league.id"
            >{{ league.id }}</ui-radio
          >
          <template v-if="byTime">
            <ui-radio
              class="mt-3"
              v-model="filters.trade.currency"
              :value="undefined"
              >{{ t(":currency_any") }}</ui-radio
            >
            <ui-radio v-model="filters.trade.currency" value="exalted">{{
              t(":currency_only_exalted")
            }}</ui-radio>
            <!-- <ui-radio v-model="filters.trade.currency" value="chaos">{{
              t(":currency_only_chaos")
            }}</ui-radio> -->
            <ui-radio v-model="filters.trade.currency" value="divine">{{
              t(":currency_only_div")
            }}</ui-radio>
            <ui-radio v-model="filters.trade.currency" value="exalted_divine">{{
              t(":currency_exalted_div")
            }}</ui-radio>
          </template>
        </div>
        <div class="flex flex-col gap-y-1">
          <div>
            <input
              :class="$style.input"
              step="any"
              type="number"
              v-model.number="localCurrencyRatio"
              @focus="inputFocus"
              @blur="inputBlur"
              @mousewheel.stop
              :style="{
                width: `${1.2 + Math.max(String(localCurrencyRatio).length, 2)}ch`,
              }"
            /><span>ex : 1 div</span>
          </div>
        </div>
      </div>
    </template>
  </ui-popover>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { useI18nNs } from "@/web/i18n";
import UiRadio from "@/web/ui/UiRadio.vue";
import UiToggle from "@/web/ui/UiToggle.vue";
import UiPopover from "@/web/ui/Popover.vue";
import type { ItemFilters } from "../filters/interfaces";
import { useLeagues } from "@/web/background/Leagues";
import { CURRENCY_RATIO } from "../filters/create-item-filters";

export default defineComponent({
  components: { UiRadio, UiToggle, UiPopover },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true,
    },
    byTime: {
      type: Boolean,
      default: false,
    },
    currencyRatio: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const leagues = useLeagues();
    const { t } = useI18nNs("online_filter");

    const _localCurrencyRatio = ref(props.filters.trade.currencyRatio);

    if (!props.filters.trade.currencyRatio) {
      props.filters.trade.currencyRatio = _localCurrencyRatio.value;
    }

    return {
      t,
      tradeLeagues: leagues.list,
      localCurrencyRatio: computed<number>({
        get() {
          return _localCurrencyRatio.value;
        },
        set(value) {
          _localCurrencyRatio.value = value;
        },
      }),
      showLeagueName: () =>
        leagues.selectedId.value !== props.filters.trade.league,
      showWarning: () =>
        Boolean(
          (props.filters.trade.listed &&
            ["1day", "3days", "1week"].includes(props.filters.trade.listed)) ||
            props.filters.trade.currency ||
            CURRENCY_RATIO !== props.filters.trade.currencyRatio,
        ),
      onOfflineUpdate(offline: boolean) {
        const { filters } = props;
        filters.trade.offline = offline;
        if (props.byTime) {
          filters.trade.listed = offline ? "2months" : undefined;
        }
      },
      inputFocus(e: FocusEvent) {
        const target = e.target as HTMLInputElement;
        target.select();
      },
      inputBlur() {
        if (typeof _localCurrencyRatio.value !== "number") {
          _localCurrencyRatio.value = CURRENCY_RATIO;
          props.filters.trade.currencyRatio = CURRENCY_RATIO;
        } else if (typeof _localCurrencyRatio.value === "number") {
          props.filters.trade.currencyRatio = _localCurrencyRatio.value;
        }
      },
    };
  },
});
</script>

<style lang="postcss" module>
.input {
  @apply text-center;
  @apply bg-transparent;
  @apply text-gray-300;
  @apply select-all;

  &:hover,
  &:focus {
    @apply bg-gray-700;
    @apply -my-px border-t border-b border-gray-500;
  }

  &::placeholder {
    @apply text-gray-400;
  }

  &:focus {
    cursor: none;
  }
}
</style>
