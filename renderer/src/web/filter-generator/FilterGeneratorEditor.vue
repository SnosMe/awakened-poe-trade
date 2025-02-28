<template>
  <!-- @deprecated -->
  <div
    class="m-3 w-3/4 bg-orange-500 text-black rounded font-extrabold text-center"
  >
    <p class="mb-1 ml-1">
      {{ t("app.deprecated", ["v0.11.0"]) }}
    </p>
  </div>
  <div class="p-2">
    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="entries"
      item-key="id"
      handle="[data-qa=drag-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: entry }">
        <div
          class="grid gap-0.5"
          style="grid-template-columns: auto 1fr auto auto"
        >
          <button
            class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
            data-qa="drag-handle"
          >
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          <input
            v-model="entry.name"
            :placeholder="t('filter_generator.friendly_name')"
            class="px-1 col-span-2 leading-6"
          />
          <button
            class="leading-none rounded-r bg-gray-700 w-6 h-6"
            @click="removeEntry(entry.id)"
          >
            <i class="fas fa-times text-gray-400" />
          </button>
          <select
            v-model="entry.action"
            class="p-1 rounded bg-gray-700 col-start-2"
          >
            <option value="interesting">Show as interesting item</option>
            <option value="exalt">Show as Exalted Orb</option>
            <option value="hide">Hide</option>
          </select>
          <div
            v-for="(identifier, identifierIdx) in entry.identifiers"
            :class="$style.identifiers"
          >
            <input
              v-model="identifier.key"
              :placeholder="t('filter_generator.identifier_key')"
              class="bg-gray-700 px-1 col-start-1 rounded"
            />
            <input
              v-model="identifier.value"
              :placeholder="t('filter_generator.identifier_value')"
              class="bg-gray-700 px-1 col-start-2 rounded"
            />
            <button
              class="rounded-r bg-gray-700 w-6 h-6 col-start-3"
              @click="removeIdentifier(entry, identifierIdx)"
            >
              <i class="fas fa-times text-gray-400" />
            </button>
          </div>
          <button
            class="rounded-r bg-gray-900 px-2 col-start-2 leading-6"
            @click="addIdentifier(entry)"
          >
            {{ t("filter_generator.identifier_add") }}
          </button>
        </div>
      </template>
    </dnd-container>
    <button class="btn mt-2" style="min-width: 6rem" @click="addEntry">
      {{ t("Add") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import HotkeyInput from "../settings/HotkeyInput.vue";
import { configProp, configModelValue } from "../settings/utils.js";
import type { FilterGeneratorWidget } from "./widget.js";

export default defineComponent({
  name: "filter_generator.editor",
  components: { DndContainer, HotkeyInput },
  props: configProp<FilterGeneratorWidget>(),
  setup(props) {
    const { t } = useI18n();

    return {
      t,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      entries: configModelValue(() => props.configWidget, "entries"),
      removeEntry(id: number) {
        console.log(props.configWidget.entries);
        props.configWidget.entries = props.configWidget.entries.filter(
          (_) => _.id !== id,
        );
      },
      addEntry() {
        console.log(...props.configWidget.entries.map((_) => _.id));
        props.configWidget.entries.push({
          id: Math.max(0, ...props.configWidget.entries.map((_) => _.id)) + 1,
          name: "",
          identifiers: [{ key: "", value: "" }],
          action: "interesting",
        });
      },
      addIdentifier(entry: FilterGeneratorWidget["entries"][number]) {
        entry.identifiers.push({
          key: "",
          value: "",
        });
      },
      removeIdentifier(
        entry: FilterGeneratorWidget["entries"][number],
        identifierIdx: number,
      ) {
        entry.identifiers.splice(identifierIdx, 1);
      },
    };
  },
});
</script>

<style lang="postcss" module>
.identifiers {
  @apply grid;
  @apply gap-0.5;
  @apply col-start-2;
  grid-template-columns: 1fr 1fr auto;
}
</style>
