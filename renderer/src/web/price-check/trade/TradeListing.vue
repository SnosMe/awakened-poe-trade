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
      />
      <div class="flex-1"></div>
      <trade-links
        v-if="list && showPseudoLink"
        :get-link="makeTradeLinkPseudo"
        text="filters.tag_pseudo"
        class="mr-1"
      />
      <trade-links v-if="list" :get-link="makeTradeLink" />
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
            <th
              v-if="
                item.category === ItemCategory.Gem ||
                item.category === ItemCategory.UncutGem
              "
              class="trade-table-heading"
            >
              <div class="px-2">{{ t(":gem_level") }}</div>
            </th>
            <th
              v-if="item.category === ItemCategory.Gem"
              class="trade-table-heading"
            >
              <div class="px-2">{{ t(":gem_sockets") }}</div>
            </th>
            <th
              v-if="filters.quality || item.category === ItemCategory.Gem"
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
            <trade-item
              v-else
              :key="result.id"
              :result="result"
              :item="item"
              :show-seller="showSeller"
              :item-level="filters.itemLevel"
              :quality="filters.quality"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <ui-error-box v-else>
    <template #name>{{ t(":error") }}</template>
    <p>Error: {{ error }}</p>
    <div v-if="error && errorFix" class="border p-1 rounded">
      {{ errorFix }}
    </div>
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
  onMounted,
  onUnmounted,
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
  StatFilter,
  WeightStatGroup,
} from "../filters/interfaces";
import { ItemCategory, ParsedItem } from "@/parser";
import { artificialSlowdown } from "./artificial-slowdown";
import OnlineFilter from "./OnlineFilter.vue";
import TradeLinks from "./TradeLinks.vue";
import TradeItem from "./TradeItem.vue";
import { CURRENCY_RATIO } from "@/web/price-check/filters/create-item-filters";

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
  ) {
    try {
      searchId += 1;
      error.value = null;
      searchResult.value = null;
      const _fetchResults: PricingResult[] = shallowReactive([]);
      fetchResults.value = _fetchResults;

      const _searchId = searchId;
      const request = createTradeRequest(filters, stats, item);
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

      if (filters.trade.currencyRatio !== CURRENCY_RATIO) {
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
  components: { OnlineFilter, TradeLinks, TradeItem, UiErrorBox, UiPopover },
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
    weightFilters: {
      type: Array as PropType<WeightStatGroup[]>,
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

    const { t } = useI18nNs("trade_result");

    function makeTradeLink() {
      return searchResult.value
        ? `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}/${searchResult.value.id}`
        : `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item))}`;
    }

    function makeTradeLinkPseudo() {
      return `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item, props.weightFilters))}`;
    }

    // Shift Key Detection
    const isShiftPressed = ref(false);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        isShiftPressed.value = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        isShiftPressed.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    });

    return {
      t,
      list: searchResult,
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
        search(props.filters, props.stats, props.item);
      },
      error,
      errorFix: computed(() => {
        console.log(error.value);
        if (error.value?.startsWith("Query is too complex.")) {
          return t(":fix_complex_query");
        }

        return undefined;
      }),
      showSeller: computed(() => widget.value.showSeller),
      makeTradeLink,
      makeTradeLinkPseudo,
      openTradeLink() {
        showBrowser(makeTradeLink());
      },
      showPseudoLink: computed(
        () =>
          props.weightFilters.length &&
          !(
            widget.value.usePseudo &&
            ["en", "ru", "ko", "cmn-Hant"].includes(AppConfig().language)
          ),
      ),
      // Shift key state and methods
      isShiftPressed,
      ItemCategory,
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

  &.merchant {
    /* */
  }

  &.online {
    @apply bg-pink-400;
  }

  &.offline {
    @apply bg-red-600;
  }

  &.afk {
    @apply bg-orange-500;
  }
}
</style>
