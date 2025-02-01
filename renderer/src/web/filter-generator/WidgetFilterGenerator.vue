<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div
      class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0 w-72"
      style="min-width: 5rem"
    >
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle || "Untitled" }}</span>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <button @click="openSettings()" :class="$style.btn">
          {{ t("filter_generator.open_settings") }}
        </button>

        <button
          v-if="config.selectedFilterFile?.length"
          @click="regenerateFilter()"
          :class="$style.btn"
        >
          {{ t("filter_generator.update_filter") }} <br />
          {{ config.selectedFilterFile }}
        </button>
        <span v-if="config.selectedFilterFile?.length">{{
          t("filter_generator.update_disclaimer")
        }}</span>
        <span v-if="!config.selectedFilterFile?.length"
          >First select a file you want to be updated with your rules.</span
        >
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from "../overlay/interfaces";
import type { FilterGeneratorWidget } from "./widget.ts";

export default {
  widget: {
    type: "filter-generator",
    instances: "single",
    initInstance: (): FilterGeneratorWidget => {
      return {
        wmId: 0,
        wmType: "filter-generator",
        wmTitle: "{icon=fa-filter}",
        wmWants: "hide",
        wmZorder: null,
        wmFlags: ["invisible-on-blur"],
        filtersFolder: "",
        selectedFilterFile: "",
        filterStrategy: "before",
        anchor: {
          pos: "tl",
          x: 34,
          y: 56,
        },
        entries: [
          {
            id: 1,
            name: "Scroll of Wisdom",
            identifiers: [{ key: "BaseType", value: "Scroll of Wisdom" }],
            action: "hide",
          },
          {
            id: 2,
            name: "Flasks",
            identifiers: [{ key: "BaseType", value: "Life Flask,Mana Flask" }],
            action: "hide",
          },
          {
            id: 3,
            name: "People get those for Headhunter unique",
            identifiers: [
              { key: "Class", value: "Belts" },
              { key: "BaseType", value: "Heavy Belt" },
              { key: "Rarity", value: "Normal" },
            ],
            action: "interesting",
          },
          {
            id: 4,
            name: "People get those for Astramentis unique",
            identifiers: [
              { key: "Class", value: "Amulets" },
              { key: "BaseType", value: "Stellar Amulet" },
              { key: "Rarity", value: "Normal" },
            ],
            action: "interesting",
          },
          {
            id: 5,
            name: "Low level area items",
            identifiers: [
              {
                key: "Class",
                value:
                  "Body Armours,Helmets,Boots,Gloves,Shields,Foci,One Hand Maces,Two Hand Maces,Quarterstaves,Bows,Crossbows",
              },
              { key: "AreaLevel", value: "< 65" },
              { key: "Rarity", value: "Normal,Magic,Rare" },
              { key: "Quality", value: "= 0" },
              { key: "Sockets", value: "= 0" },
            ],
            action: "hide",
          },
        ],
      };
    },
  } satisfies WidgetSpec,
};
</script>

<script setup lang="ts">
import { inject } from "vue";
import { useI18n } from "vue-i18n";
import { MainProcess } from "@/web/background/IPC";
import type { WidgetManager } from "../overlay/interfaces.js";

import Widget from "../overlay/Widget.vue";

const props = defineProps<{
  config: FilterGeneratorWidget;
}>();

const wm = inject<WidgetManager>("wm")!;

if (props.config.wmFlags[0] === "uninitialized") {
  props.config.wmFlags = ["invisible-on-blur"];
  props.config.anchor = {
    pos: "tl",
    x: Math.random() * (40 - 20) + 20,
    y: Math.random() * (40 - 20) + 20,
  };
  props.config.entries = [];
  wm.show(props.config.wmId);
}

function openSettings() {
  const settings = wm.widgets.value.find((w) => w.wmType === "settings")!;
  wm.setFlag(settings.wmId, `settings:widget:${props.config.wmId}`, true);
  wm.show(settings.wmId);
}

function regenerateFilter() {
  MainProcess.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: {
      action: "filter-generator:update",
      text: JSON.stringify({
        folder: props.config.filtersFolder,
        file: props.config.selectedFilterFile,
        strategy: props.config.filterStrategy,
        rules: props.config.entries,
      }),
    },
  });
}

const { t } = useI18n();
</script>

<style lang="postcss" module>
.btn {
  @apply rounded;
  @apply max-w-sm;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    @apply bg-gray-700;
  }
}
</style>
