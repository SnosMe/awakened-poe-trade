<template>
  <div :class="$style['filter']">
    <div class="flex flex-col min-w-0 flex-1">
      <div class="pb-px flex items-baseline justify-between">
        <button
          class="flex items-baseline text-left min-w-0"
          :class="{
            'pointer-events-none opacity-50': !rune.isEmpty,
          }"
          type="button"
          @disabled="!rune.isEmpty"
          @click="toggleFilter"
        >
          <i
            class="w-5"
            :class="{
              'far fa-check-square text-gray-500 opacity-50': !rune.isEmpty, // Inverted checked box
              'far fa-square text-gray-500': isDisabled && rune.isEmpty,
              'fas fa-check-square': !isDisabled && rune.isEmpty,
            }"
          ></i>
          <div
            class="search-text flex-1 mr-1 relative flex min-w-0"
            style="line-height: 1rem"
          >
            <span class="truncate"><item-modifier-text :text="text" /></span>
            <span class="search-text-full whitespace-pre-wrap"
              ><item-modifier-text :text="text"
            /></span>
          </div>
        </button>
        <div v-if="rune.isEmpty" class="flex items-baseline gap-x-1">
          <select
            :disabled="isDisabled"
            :class="$style['rollInput']"
            v-model="selectedRune"
          >
            <option value="" disabled>Select a rune</option>
            <option
              v-for="option in runeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex">
        <div class="w-5 flex items-start"></div>
        <div class="flex-1 flex items-start gap-x-2">
          <span
            v-if="!rune.isEmpty"
            :class="[$style['tag'], $style[`tag-explicit`]]"
            >{{ rune.rune }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useI18n } from "vue-i18n";

import ItemModifierText from "../../ui/ItemModifierText.vue";
import { computed, defineComponent, PropType, ref } from "vue";
import { ParsedItem } from "@/parser";
import { RuneFilter } from "./interfaces";

export default defineComponent({
  components: { ItemModifierText },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    rune: {
      type: Object as PropType<RuneFilter>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const item = props.item;
    const selectedRune = ref<string>(""); // Initialize selectedRune

    // Sample rune options you can modify according to your needs
    const runeOptions = [
      { value: "rune1", text: "%NOT_IMPLEMENTED% 1" },
      { value: "rune2", text: "%NOT_IMPLEMENTED% 2" },
      { value: "rune3", text: "%NOT_IMPLEMENTED% 3" },
    ];

    function toggleFilter() {
      if (!props.rune.isEmpty) return;
      props.rune.disabled = !props.rune.disabled;
    }

    return {
      t,
      item,
      selectedRune,
      runeOptions,
      text: computed(() => {
        if (props.rune.isEmpty) {
          return t("filters.empty_rune_socket");
        } else {
          return props.rune.text!;
        }
      }),
      isDisabled: computed(() => props.rune.disabled),
      toggleFilter,
    };
  },
});
</script>

<style lang="postcss" module>
.filter {
  @apply py-2;
  @apply border-b border-gray-700;
  display: flex;
  position: relative;
}

.rollInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply px-1;
  @apply border border-transparent;

  &:first-child {
    @apply rounded-l;
  }
  &:last-child {
    @apply rounded-r;
  }

  &::placeholder {
    @apply text-gray-700;
    font-size: 0.8125rem;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
  }
}

.rollInput option {
  direction: ltr;
}

.qualityLabel {
  @apply text-gray-500;
  @apply border border-gray-700;
  @apply rounded;
  @apply px-2;
  text-align: center;
}

.mods {
  @apply border-b-4 border-gray-500;
  background: linear-gradient(
    to bottom,
    theme("colors.gray.800"),
    theme("colors.gray.900")
  );
  @apply -mx-4 px-4;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
}

.filter:not(:hover) > .mods {
  display: none;
}

.tag {
  @apply px-1;
  @apply rounded;
  @apply text-xs;
  line-height: 1;
}
.tag-variant {
  @apply bg-yellow-700 text-yellow-100;
}
.tag-eldritch {
  background: linear-gradient(
    to right,
    theme("colors.red.700"),
    theme("colors.blue.700")
  );
}
.tag-explicit-shaper,
.tag-explicit-elder,
.tag-explicit-crusader,
.tag-explicit-hunter,
.tag-explicit-redeemer,
.tag-explicit-warlord,
.tag-explicit-delve,
.tag-explicit-veiled,
.tag-explicit-incursion {
  display: flex;
  align-items: center;
  @apply -mx-1 pl-0.5 gap-x-0.5 text-gray-600;
  text-shadow: 0 0 4px theme("colors.gray.900");

  &::before {
    background-size: contain;
    @apply w-5 h-5 -my-5;
    content: "";
  }
}
.tag-explicit-shaper::before {
  background-image: url("/images/influence-Shaper.png");
}
.tag-explicit-elder::before {
  background-image: url("/images/influence-Elder.png");
}
.tag-explicit-crusader::before {
  background-image: url("/images/influence-Crusader.png");
}
.tag-explicit-hunter::before {
  background-image: url("/images/influence-Hunter.png");
}
.tag-explicit-redeemer::before {
  background-image: url("/images/influence-Redeemer.png");
}
.tag-explicit-warlord::before {
  background-image: url("/images/influence-Warlord.png");
}
.tag-explicit-delve::before {
  background-image: url("/images/delve.png");
}
.tag-explicit-veiled::before {
  background-image: url("/images/veiled.png");
}
.tag-explicit-incursion::before {
  background-image: url("/images/incursion.png");
}

.tag-corrupted {
  @apply bg-red-700 text-red-100;
}
.tag-fractured {
  @apply bg-yellow-400 text-black;
}
.tag-crafted,
.tag-synthesised {
  @apply bg-blue-600 text-blue-100;
}
.tag-implicit,
.tag-explicit {
  @apply -mx-1 text-gray-600;
  text-shadow: 0 0 4px theme("colors.gray.900");
}
.tag-scourge {
  @apply bg-orange-600 text-white;
}
.tag-enchant {
  @apply bg-purple-600 text-purple-100;
}
.tag-pseudo {
  @apply bg-gray-700 text-black;
}
</style>

<style lang="postcss">
.search-text-full {
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  padding-bottom: 1px;
  z-index: 10;

  .search-text:not(:hover) & {
    display: none;
  }

  .search-text:hover & {
    @apply bg-gray-700;
  }
}
</style>
