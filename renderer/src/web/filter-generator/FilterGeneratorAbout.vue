<template>
  <!-- @deprecated -->
  <div
    class="m-3 w-3/4 bg-orange-500 text-black rounded font-extrabold text-center"
  >
    <p class="mb-1 ml-1">
      {{ t("app.deprecated", ["v0.11.0"]) }}
    </p>
  </div>
  <div class="p-3">
    <p class="mb-1 ml-1">{{ t("filter_generator.about_folder") }}</p>
    <input
      type="text"
      class="p-1 rounded bg-gray-700 w-3/4 col-start-2 mb-4 ml-1"
      v-model="filtersFolder"
      v-on:input="clearFiles"
      v-on:blur="requestFilesList"
    />
    <p class="mb-1 ml-1">{{ t("filter_generator.about_file_select") }}</p>
    <select
      v-model="selectedFilterFile"
      class="p-1 rounded bg-gray-700 col-start-2 mb-4 ml-1"
    >
      <option v-for="file in files" :key="file" :value="file">
        {{ file }}
      </option>
    </select>
    <p class="mb-1 ml-1">{{ t("filter_generator.about_strategy_select") }}</p>
    <select
      v-model="filterStrategy"
      class="p-1 rounded bg-gray-700 col-start-2 mb-4 ml-1"
    >
      <option value="before">the beginning of the file</option>
      <option value="after">the end of the file</option>
    </select>

    <h2 class="text-lg mb-1">
      {{ t("filter_generator.about_disclaimer_header") }}
    </h2>
    <p class="mb-4 ml-1">
      {{ t("filter_generator.about_disclaimer_text1") }}<br />
      {{ t("filter_generator.about_disclaimer_text2") }}<br />
      <a
        href="https://www.pathofexile.com/item-filter/about"
        target="_blank"
        class="bg-gray-900 px-1 rounded"
        >https://www.pathofexile.com/item-filter/about
        {{ t("filter_generator.about_disclaimer_link_desc") }}</a
      ><br />
      {{ t("filter_generator.about_disclaimer_text3") }}
    </p>
    <p class="mb-4 ml-1">
      {{ t("filter_generator.base_type_note") }}
    </p>
    <h2 class="text-lg mb-1">{{ t("filter_generator.examples_header") }}</h2>
    <div class="grid grid-cols-2 gap-1 ml-1">
      <div class="col-span-2 p-1 border-2 border-gray-600">
        {{ t("filter_generator.examples_class") }}
      </div>
      <div>Class</div>
      <div>Belts</div>
      <div class="col-span-2 p-1 border-2 border-gray-600">
        {{ t("filter_generator.examples_class_multi") }}
      </div>
      <div>Class</div>
      <div>Belts,Amulets</div>
      <div class="col-span-2 p-1 border-2 border-gray-600">
        {{ t("filter_generator.examples_name") }}
      </div>
      <div>BaseType</div>
      <div>Stellar Amulet</div>
      <div class="col-span-2 p-1 border-2 border-gray-600">
        {{ t("filter_generator.examples_name_multi") }}
      </div>
      <div>BaseType</div>
      <div>Life Flask,Mana Flask</div>
      <div class="col-span-2 p-1 border-2 border-gray-600">
        {{ t("filter_generator.examples_complex") }}
      </div>
      <div>Class</div>
      <div>Belts</div>
      <div>AreaLevel</div>
      <div>&lt; 50</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import HotkeyInput from "../settings/HotkeyInput.vue";
import { configProp, configModelValue } from "../settings/utils.js";
import type { FilterGeneratorWidget } from "./widget.js";
import { Host, MainProcess } from "@/web/background/IPC";

export default defineComponent({
  name: "filter_generator.name",
  components: { DndContainer, HotkeyInput },
  props: configProp<FilterGeneratorWidget>(),
  setup(props) {
    const { t } = useI18n();
    const filtersFolder = configModelValue(
      () => props.configWidget,
      "filtersFolder",
    );
    const selectedFilterFile = configModelValue(
      () => props.configWidget,
      "selectedFilterFile",
    );
    const files = ref<string[]>([]);

    Host.onEvent(
      "MAIN->CLIENT::filter-generator:list",
      (event: { folder: string; files: string[] }) => {
        filtersFolder.value = event.folder;
        files.value = event.files;
      },
    );

    onMounted(requestFilesList);

    function requestFilesList() {
      MainProcess.sendEvent({
        name: "CLIENT->MAIN::user-action",
        payload: {
          action: "filter-generator:list",
          text: filtersFolder.value,
        },
      });
    }

    function clearFiles() {
      files.value = [];
      selectedFilterFile.value = "";
    }

    return {
      t,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      filtersFolder,
      selectedFilterFile,
      filterStrategy: configModelValue(
        () => props.configWidget,
        "filterStrategy",
      ),
      files,
      requestFilesList,
      clearFiles,
    };
  },
});
</script>
