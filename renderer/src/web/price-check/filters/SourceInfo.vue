<template>
  <div>
    <div :class="$style['modinfo']">{{ modText }}</div>
    <div v-for="stat of stats" :key="stat.text" class="flex items-baseline">
      <ItemModifierText
        :text="stat.text"
        :roll="stat.roll"
        :class="{ 'line-through': !stat.contributes }"
      />
      <div
        v-if="stat.contributes && stat.contribution"
        :class="$style['contribution']"
      >
        {{ stat.contribution }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { applyIncr } from "@/parser/advanced-mod-desc";
import { roundRoll } from "./util";
import type { StatCalculated } from "@/parser/modifiers";
import type { StatFilter } from "./interfaces";

import ItemModifierText from "@/web/ui/ItemModifierText.vue";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";

const tierOption = computed(
  () => AppConfig<PriceCheckWidget>("price-check")!.tierNumbering,
);

const props = defineProps<{
  source: StatCalculated["sources"][number];
  filter: StatFilter;
}>();

const { t } = useI18n();

const modText = computed(() => {
  const { info } = props.source.modifier;

  let text = t(`item.mod_${info.type}`);
  if (info.name) {
    text += ` "${info.name}"`;
  }
  if (info.tier != null || info.rank != null) {
    if (tierOption.value === "poe1") {
      text += ` (${t("item.mod_grade", [info.tier])})`;
    } else {
      text += ` (${t("item.mod_tier", [info.tierNew])} [${info.tier! + info.tierNew! - 1}])`;
    }
  }
  if (info.rank != null) {
    text += ` (${t("item.mod_rank", [info.rank])})`;
  }
  return text;
});

/*
1   +(5–8)   to Intelligence (Tier: 1[8]) (Grade: 8)
11  +(9–12)  to Intelligence (Tier: 2[8]) (Grade: 7)
22  +(13–16) to Intelligence (Tier: 3[8]) (Grade: 6)
33  +(17–20) to Intelligence (Tier: 4[8]) (Grade: 5)
44  +(21–24) to Intelligence (Tier: 5[8]) (Grade: 4)
55  +(25–27) to Intelligence (Tier: 6[8]) (Grade: 3)
66  +(28–30) to Intelligence (Tier: 7[8]) (Grade: 2)
74  +(31–33) to Intelligence (Tier: 8[8]) (Grade: 1)
 */

const stats = computed(() => {
  const { stats } = props.source.modifier;
  const { stat: contribStat } = props.source.stat;

  let contribution = props.source.contributes?.value;
  if (contribution != null) {
    const filter = props.filter.roll!;
    contribution *= filter.isNegated ? -1 : 1;
    contribution = roundRoll(contribution, filter.dp);
  }

  return stats.map((parsed) => {
    if (parsed.stat.ref !== contribStat.ref) {
      return {
        text: parsed.translation.string,
        contributes: false,
      };
    }
    parsed = applyIncr(props.source.modifier.info, parsed) ?? parsed;
    if (!parsed.roll) {
      return {
        text: parsed.translation.string,
        contribution,
        contributes: true,
      };
    }

    const rollValue = parsed.roll.value * (parsed.translation.negate ? -1 : 1);
    return {
      text: parsed.translation.string,
      roll: roundRoll(rollValue, parsed.roll.dp),
      contribution: contribution!,
      contributes: true,
    };
  });
});
</script>

<style lang="postcss" module>
.modinfo {
  @apply text-gray-500;
  font-style: italic;
}

.contribution {
  margin-left: auto;
  @apply w-12;
  @apply rounded;
  @apply border border-gray-700;
  text-align: center;
  flex-shrink: 0;
}
</style>
