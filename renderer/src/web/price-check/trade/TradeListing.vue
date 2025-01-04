<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto">
    <div class="mb-2 flex pl-2">
      <div class="flex items-baseline text-gray-500 mr-2">
        <span class="mr-1">{{ t(":matched") }}</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? "+" : "" }}</span>
      </div>
      <online-filter
        v-if="list"
        :by-time="true"
        :filters="filters"
        :currency-ratio="true"
        :suggest="suggest"
      />
      <div class="flex-1"></div>
      <trade-links v-if="list" :get-link="makeTradeLink" />
    </div>
    <ui-popover
      :delay="[150, null]"
      placement="bottom-end"
      boundary="#price-window"
      v-if="suggest && showSuggestWarning === 'help'"
    >
      <template #target>
        <div v-if="suggest" class="mb-4 text-center bg-orange-800 rounded-xl">
          <div class="font-bold" v-if="suggest.confidenceLevel === 'High'">
            {{ t(":results_warn_title") }}
          </div>
          {{ suggest.text }}
        </div>
      </template>
      <template #content>
        <div style="max-width: 18.5rem" class="text-xs">
          {{ t(":results_warn_tooltip") }}
        </div>
      </template>
    </ui-popover>
    <div
      v-if="suggest && showSuggestWarning === 'warn'"
      class="mb-4 text-center bg-orange-800 rounded-xl"
    >
      <div class="font-bold" v-if="suggest.confidenceLevel === 'High'">
        {{ t(":results_warn_title") }}
      </div>
      {{ suggest.text }}
    </div>

    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ t(":price") }}</div>
            </th>
            <th v-if="item.stackSize" class="trade-table-heading">
              <div class="px-2">{{ t(":stock") }}</div>
            </th>
            <th v-if="filters.itemLevel" class="trade-table-heading">
              <div class="px-2">{{ t(":item_level") }}</div>
            </th>
            <th v-if="item.category === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t(":gem_level") }}</div>
            </th>
            <th v-if="item.category === 'Gem'" class="trade-table-heading">
              <div class="px-2">{{ t(":gem_sockets") }}</div>
            </th>
            <th
              v-if="filters.quality || item.category === 'Gem'"
              class="trade-table-heading"
            >
              <div class="px-2">{{ t(":quality") }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem">{{
                  t(":listed")
                }}</span>
              </div>
            </th>
            <th v-if="showSeller" class="trade-table-heading w-full">
              <div class="px-2">{{ t(":seller") }}</div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll">
          <template v-for="(result, idx) in groupedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <tr v-else :key="result.id">
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
                  ><span class="font-sans">×</span>
                  {{ result.listedTimes }}</span
                ><i v-else-if="!result.hasNote" class="fas fa-question" />
              </td>
              <td v-if="item.stackSize" class="px-2 text-right">
                {{ result.stackSize }}
              </td>
              <td
                v-if="filters.itemLevel"
                class="px-2 whitespace-nowrap text-right"
              >
                {{ result.itemLevel }}
              </td>
              <td v-if="item.category === 'Gem'" class="pl-2 whitespace-nowrap">
                {{ result.level }}
              </td>
              <td v-if="item.category === 'Gem'" class="pl-2 whitespace-nowrap">
                {{ result.gemSockets }}
              </td>
              <td
                v-if="filters.quality || item.category === 'Gem'"
                class="px-2 whitespace-nowrap text-blue-400 text-right"
              >
                {{ result.quality }}
              </td>
              <td class="pr-2 pl-4 whitespace-nowrap">
                <div class="inline-flex items-center">
                  <div
                    class="account-status"
                    :class="result.accountStatus"
                  ></div>
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
        </tbody>
      </table>
    </div>
  </div>
  <ui-error-box v-else>
    <template #name>{{ t(":error") }}</template>
    <p>Error: {{ error }}</p>
    <template #actions>
      <button class="btn" @click="execSearch">{{ t("Retry") }}</button>
      <button class="btn" @click="openTradeLink">{{ t("Browser") }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  watch,
  PropType,
  inject,
  shallowReactive,
  shallowRef,
  ref,
} from "vue";
import { useI18nNs } from "@/web/i18n";
import UiPopover from "@/web/ui/Popover.vue";
import UiErrorBox from "@/web/ui/UiErrorBox.vue";
import {
  requestTradeResultList,
  requestResults,
  createTradeRequest,
  PricingResult,
  SearchResult,
} from "./pathofexile-trade";
import { getTradeEndpoint } from "./common";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/interfaces";
import {
  ItemFilters,
  RuneFilter,
  StatFilter,
  Suggestion,
} from "../filters/interfaces";
import { ParsedItem } from "@/parser";
import { artificialSlowdown } from "./artificial-slowdown";
import OnlineFilter from "./OnlineFilter.vue";
import TradeLinks from "./TradeLinks.vue";
import { Host } from "@/web/background/IPC";

const slowdown = artificialSlowdown(900);

const SHOW_RESULTS = 20;
const API_FETCH_LIMIT = 100;
const MIN_NOT_GROUPED = 7;
const MIN_GROUPED = 10;

function useTradeApi() {
  let searchId = 0;
  const error = shallowRef<string | null>(null);
  const searchResult = shallowRef<SearchResult | null>(null);
  const fetchResults = shallowRef<PricingResult[]>([]);

  const groupedResults = computed(() => {
    const out: Array<PricingResult & { listedTimes: number }> = [];
    for (const result of fetchResults.value) {
      if (result == null) break;
      if (out.length === 0) {
        out.push({ listedTimes: 1, ...result });
        continue;
      }
      const existingRes = out.find(
        (added, idx) =>
          (added.accountName === result.accountName &&
            added.priceCurrency === result.priceCurrency &&
            added.priceAmount === result.priceAmount) ||
          (added.accountName === result.accountName && out.length - idx <= 2), // last or prev
      );
      if (existingRes) {
        if (existingRes.stackSize) {
          existingRes.stackSize += result.stackSize!;
        } else {
          existingRes.listedTimes += 1;
        }
      } else {
        out.push({ listedTimes: 1, ...result });
      }
    }
    return out;
  });

  async function search(
    filters: ItemFilters,
    stats: StatFilter[],
    item: ParsedItem,
    runeFilters: RuneFilter[],
  ) {
    try {
      searchId += 1;
      error.value = null;
      searchResult.value = null;
      const _fetchResults: PricingResult[] = shallowReactive([]);
      fetchResults.value = _fetchResults;

      const _searchId = searchId;
      const request = createTradeRequest(filters, stats, item, runeFilters);
      const _searchResult = await requestTradeResultList(
        request,
        filters.trade.league,
      );
      if (_searchId !== searchId) {
        return;
      }
      searchResult.value = _searchResult;

      // first two req are parallel, then sequential on demand
      {
        const r1 =
          _searchResult.result.length > 0
            ? requestResults(
                _searchResult.id,
                _searchResult.result.slice(0, 10),
                { accountName: AppConfig().accountName },
              ).then((results) => {
                _fetchResults.push(...results);
              })
            : Promise.resolve();
        const r2 =
          _searchResult.result.length > 10
            ? requestResults(
                _searchResult.id,
                _searchResult.result.slice(10, 20),
                { accountName: AppConfig().accountName },
              ).then((results) =>
                r1.then(() => {
                  _fetchResults.push(...results);
                }),
              )
            : Promise.resolve();
        await Promise.all([r1, r2]);
      }

      if (filters.trade.currencyRatio) {
        // Check if there exists any entry with priceCurrency "DIVINE"
        const hasDivine = fetchResults.value.some(
          (result) => result.priceCurrency === "divine",
        );

        if (hasDivine) {
          // Sort the fetch results based on the exchange ratios
          fetchResults.value.sort((a, b) => {
            const getCurrencyValue = (currency: string): number => {
              switch (currency) {
                case "exalted":
                  return 1; // 1:1
                case "divine":
                  return filters.trade.currencyRatio!; // 1:<currencyRatio>
                case "chaos":
                  return 5; // 1:5
                default:
                  return 1 / 40; // Default 40:1 for all other currencies
              }
            };

            const aValue = a.priceAmount * getCurrencyValue(a.priceCurrency);
            const bValue = b.priceAmount * getCurrencyValue(b.priceCurrency);

            // Ascending order
            return aValue - bValue;
          });
        }
      }

      let fetched = 20;
      async function fetchMore(): Promise<void> {
        if (_searchId !== searchId) return;
        const totalGrouped = groupedResults.value.length;
        const totalNotGrouped = groupedResults.value.reduce(
          (len, res) => (res.listedTimes <= 2 ? len + 1 : len),
          0,
        );
        if (
          (totalNotGrouped < MIN_NOT_GROUPED || totalGrouped < MIN_GROUPED) &&
          fetched < _searchResult.result.length &&
          fetched < API_FETCH_LIMIT
        ) {
          await requestResults(
            _searchResult.id,
            _searchResult.result.slice(fetched, fetched + 10),
            { accountName: AppConfig().accountName },
          ).then((results) => {
            _fetchResults.push(...results);
          });
          fetched += 10;
          return fetchMore();
        }
      }
      return fetchMore();
    } catch (err) {
      error.value = (err as Error).message;
    }
  }

  return { error, searchResult, groupedResults, search };
}

export default defineComponent({
  components: { OnlineFilter, TradeLinks, UiErrorBox, UiPopover },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true,
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    runeFilters: {
      type: Array as PropType<RuneFilter[]>,
      required: true,
    },
  },
  setup(props) {
    const widget = computed(() => AppConfig<PriceCheckWidget>("price-check")!);
    watch(
      () => props.item,
      (item) => {
        slowdown.reset(item);
      },
      { immediate: true },
    );

    const { error, searchResult, groupedResults, search } = useTradeApi();

    const showBrowser = inject<(url: string) => void>("builtin-browser")!;

    const suggest = ref<Suggestion | undefined>(undefined);
    const { t } = useI18nNs("trade_result");

    function makeTradeLink() {
      return searchResult.value
        ? `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}/${searchResult.value.id}`
        : `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item, props.runeFilters))}`;
    }

    watch(groupedResults, (values) => {
      if (
        widget.value.showSuggestWarning !== "none" &&
        !props.filters.trade.currency
      ) {
        if (!values.length) return;
        const totalResults = values.length;
        const divineResults = values.filter(
          (result) => result.priceCurrency === "divine",
        );
        const divineCount = divineResults.length;
        if (!divineCount) return;
        const exaltResults = values.filter(
          (result) => result.priceCurrency === "exalted",
        );
        const exaltCount = exaltResults.length;
        const maxDivine = divineResults.reduce(
          (max, result) => Math.max(max, result.priceAmount),
          0,
        );
        const maxExalt = exaltResults.reduce(
          (max, result) => Math.max(max, result.priceAmount),
          0,
        );
        const oneDivCount = divineResults.filter(
          (result) => result.priceAmount === 1,
        ).length;
        const text = t(":results_warn_message", [
          maxDivine * 7.5,
          props.filters.trade.currencyRatio ?? 100 * maxDivine,
        ]);
        if (oneDivCount === totalResults) {
          // console.log("Condition only one div");
          suggest.value = {
            type: "exalted",
            text,
            confidenceLevel: "High",
          };
        } else if (
          divineCount === totalResults &&
          divineResults.every((result) => result.priceAmount <= 3)
        ) {
          // console.log("All divs and less than 3 max");
          suggest.value = {
            type: "exalted",
            text,
            confidenceLevel: "Low",
          };
        } else if (
          divineCount > (totalResults / 3) * 2 &&
          divineCount < totalResults &&
          maxDivine <= 3
        ) {
          // console.log("divs more than 2/3 of results and less than 3 max");
          suggest.value = {
            type: "exalted",
            text,
            confidenceLevel: "Medium",
          };
        } else if (
          divineCount > totalResults / 2 &&
          exaltCount > 0 &&
          maxExalt <= 30
        ) {
          // console.log("Exalted and less than 30 max");
          suggest.value = {
            type: "exalted",
            text,
            confidenceLevel: "Medium",
          };
        } else {
          suggest.value = undefined;
        }
      }
    });

    return {
      t,
      list: searchResult,
      suggest,
      groupedResults: computed(() => {
        if (!slowdown.isReady.value) {
          return Array<undefined>(SHOW_RESULTS);
        } else {
          return [
            ...groupedResults.value,
            ...(groupedResults.value.length < SHOW_RESULTS
              ? Array<undefined>(SHOW_RESULTS - groupedResults.value.length)
              : []),
          ];
        }
      }),
      execSearch: () => {
        search(props.filters, props.stats, props.item, props.runeFilters);
      },
      error,
      showSeller: computed(() => widget.value.showSeller),
      showSuggestWarning: computed(() => widget.value.showSuggestWarning),
      makeTradeLink,
      openTradeLink() {
        if (widget.value.builtinBrowser && Host.isElectron) {
          showBrowser(makeTradeLink());
        } else {
          window.open(makeTradeLink());
        }
      },
    };
  },
});
</script>

<style lang="postcss">
.trade-table-heading {
  @apply sticky top-0;
  @apply bg-gray-800;
  @apply p-0 m-0;
  @apply whitespace-nowrap;

  & > div {
    @apply border-b border-gray-700;
  }
}

.account-status {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  &.online {
    /* */
  }

  &.offline {
    @apply bg-red-600;
  }

  &.afk {
    @apply bg-orange-500;
  }
}
</style>
