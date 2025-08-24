import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItemFilters } from "@/web/price-check/filters/interfaces";
import { ParsedItem } from "@/parser";
import { useTradeApi } from "@/web/price-check/trade/trade-api";
import {
  createTradeRequest,
  requestResults,
  requestTradeResultList,
} from "@/web/price-check/trade/pathofexile-trade";
import { setupTests } from "../vitest.setup";
import { loadForLang } from "@/assets/data";

vi.mock("@/web/price-check/trade/pathofexile-trade", () => {
  return {
    createTradeRequest: vi.fn(),
    requestTradeResultList: vi.fn(),
    requestResults: vi.fn(),
  };
});

describe("useTradeApi", () => {
  let composableResult: ReturnType<typeof useTradeApi>;

  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
    composableResult = useTradeApi();
    vi.clearAllMocks();
  });

  it("initializes error and results as empty", () => {
    expect(composableResult.error.value).toBeNull();
    expect(composableResult.searchResult.value).toBeNull();
  });

  it("when trade request throws, error is set", async () => {
    vi.mocked(createTradeRequest).mockImplementation(() => {
      throw new Error("test");
    });

    expect(composableResult.error.value).toBeNull();
    await composableResult.search({} as ItemFilters, [], {} as ParsedItem);
    expect(composableResult.error.value).toBe("test");
    expect(createTradeRequest).toHaveBeenCalled();
  });

  it.each([
    [1, 1],
    [10, 1],
    [11, 2],
    [20, 2],
    [21, 3],
  ])(
    "when result list has %i result(s), requestResults is called %i time(s)",
    async (resultCount, expectedCalls) => {
      vi.mocked(createTradeRequest).mockReturnValue(
        {} as ReturnType<typeof createTradeRequest>,
      );
      vi.mocked(requestTradeResultList).mockResolvedValue({
        id: "test",
        result: Array.from({ length: resultCount }, (_, i) => `test-${i}`),
        total: resultCount,
        inexact: false,
      });
      vi.mocked(requestResults).mockResolvedValue([{} as any]);

      expect(composableResult.error.value).toBeNull();
      await composableResult.search(
        { trade: { league: "test" } } as ItemFilters,
        [],
        {} as ParsedItem,
      );
      expect(composableResult.error.value).toBeNull();
      expect(requestResults).toHaveBeenCalledTimes(expectedCalls);
    },
  );
});
