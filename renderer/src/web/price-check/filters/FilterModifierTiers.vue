<template>
  <div
    v-if="tags.length"
    class="flex items-center text-xs leading-none gap-x-1"
  >
    <span v-for="tag of tags" :class="$style[tag.type]">{{
      t(tierOption == "poe2" ? "filters.tier" : "filters.grade", [tag.tier])
    }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ItemCategory, ParsedItem } from "@/parser";
import UiPopover from "@/web/ui/Popover.vue";
import { FilterTag, StatFilter } from "./interfaces";
import ItemModifierText from "../../ui/ItemModifierText.vue";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { StatSource } from "@/parser/modifiers";

export default defineComponent({
  components: { ItemModifierText, UiPopover },
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const tierOption = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.tierNumbering,
    );
    const alwaysShowTier = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.alwaysShowTier,
    );

    const tags = computed(() => {
      const { filter, item } = props;
      const out: Array<{
        type: string;
        tier: number | string;
        realTier: number;
        source: StatSource;
      }> = [];
      for (const source of filter.sources) {
        const tier = source.modifier.info.tier;
        const tierNew = source.modifier.info.tierNew;
        if (!tier || !tierNew) continue;
        const usedTier: number | string =
          tierOption.value === "poe1" ? tier : tierNew;

        if (
          (filter.tag === FilterTag.Explicit ||
            filter.tag === FilterTag.Pseudo ||
            filter.tag === FilterTag.Property) &&
          item.category !== ItemCategory.Jewel &&
          item.category !== ItemCategory.ClusterJewel &&
          item.category !== ItemCategory.MemoryLine
        ) {
          if (tier === 1)
            out.push({
              type: "tier-1",
              tier: usedTier,
              realTier: tier,
              source,
            });
          else if (tier === 2)
            out.push({
              type: "tier-2",
              tier: usedTier,
              realTier: tier,
              source,
            });
          else if (alwaysShowTier.value)
            out.push({
              type: "not-tier-1",
              tier:
                tierOption.value === "poe1"
                  ? tier
                  : tierNew.toString() + ` [${tierNew + tier - 1}]`,
              realTier: tier,
              source,
            });
        } else if (tier >= 2) {
          // fractured, explicit-* filters
          out.push({
            type: "tier-other",
            tier: usedTier,
            realTier: tier,
            source,
          });
        }
      }
      out.sort((a, b) => a.realTier - b.realTier);
      return out;
    });

    const { t } = useI18n();
    return { t, tags, tierOption, filter: props.filter };
  },
});
</script>

<style lang="postcss" module>
.tier-1,
.tier-2,
.not-tier-1,
.tier-other {
  @apply rounded px-1;
}

.tier-1 {
  @apply bg-yellow-500 text-black;
}
.tier-2 {
  @apply border -my-px border-yellow-500 text-yellow-500;
}
.tier-other {
  @apply bg-gray-700 text-black border -my-px border-black;
}
.not-tier-1 {
  @apply bg-gray-700 text-black;
}
.is-maybe-hybrid {
  @apply line-through;
}
</style>
