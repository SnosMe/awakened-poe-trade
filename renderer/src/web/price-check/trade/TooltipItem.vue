<template>
  <div v-if="item" class="flex flex-row items-start max-w-[48rem] shadow-2xl">
    <div v-if="item.icon" class="flex-none bg-gray-800 bg-opacity-80 self-stretch flex items-center">
      <ui-detailed-item-img
        :icon="item.icon.url"
        :item-width="item.icon.w"
        :item-height="item.icon.h"
        :sockets="item.sockets"
      />
    </div>
    <div class="flex flex-col min-w-[22rem] max-w-[36rem] bg-black text-center border border-gray-700">
      <div
        class="flex flex-col items-center justify-center text-base px-12 leading-tight"
        :class="$style[`${frameRarity}-title`]"
      >
        <div v-if="item.title.length">{{ item.title[0] }}</div>
        <div v-if="item.title.length > 1">{{ item.title[1] }}</div>
      </div>
      <div
        v-if="influenceBadges.length"
        data-testid="item-influences"
        class="flex flex-wrap items-center justify-center gap-1 px-3 py-1 border-b border-gray-800 bg-gray-900"
      >
        <span
          v-for="badge in influenceBadges"
          :key="badge.type"
          :data-influence="badge.type"
          class="inline-flex items-center gap-0.5 rounded-sm border border-gray-700 bg-black px-1.5 py-0.5 text-xs leading-none"
          :class="$style[`influence-${badge.type}`]"
        >
          <img
            v-if="badge.icon"
            :src="badge.icon"
            :alt="`${badge.label} influence`"
            class="w-4 h-4 -my-1"
          >
          <span v-else class="inline-block w-1.5 h-1.5 rounded-full" :class="$style[`influence-mark-${badge.type}`]" />
          {{ badge.label }}
        </span>
      </div>
      <div class="flex flex-col px-3 py-1 text-sm leading-snug">
        <template v-for="(section, index) in sections" :key="section.key">
          <div v-if="section.content?.length">
            <div
              v-for="(line, lineIndex) in section.content"
              :key="`${line.text}-${lineIndex}`"
              data-testid="modifier-line"
              :data-mod-influence="line.influence"
              class="flex items-center justify-between gap-3"
            >
              <span class="flex-grow text-center whitespace-pre-line">
                <span :class="line.influence ? $style[`influence-${line.influence}`] : line.value != null ? 'text-gray-400' : $style[`number-color-${line.color}`]">{{ line.text }}</span>
                <span v-if="line.value != null" :class="line.influence ? $style[`influence-${line.influence}`] : $style[`number-color-${line.color}`]">{{ line.value }}</span>
              </span>
              <span
                v-if="line.tier"
                class="flex-none text-xs"
                :class="line.influence
                  ? $style[`influence-${line.influence}`]
                  : {
                  'text-blue-300': line.tier.startsWith('S'),
                  'text-red-300': line.tier.startsWith('P'),
                  'text-gray-400': !line.tier.startsWith('S') && !line.tier.startsWith('P')
                }"
              >{{ line.tier }}</span>
            </div>
          </div>
          <template v-if="dividerVisible[index]">
            <div
              v-if="frameRarity !== 'Normal'"
              :class="$style[`${frameRarity}-separator`]"
            />
            <hr
              v-else
              class="block h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-1 border-0"
            >
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PricingResult } from './pathofexile-trade'
import { orderDisplayAffixes, type DisplayInfluence, type DisplayItemLine } from './trade-tooltip'
import UiDetailedItemImg from '@/web/ui/UiDetailedItemImg.vue'

const props = defineProps<{
  result: PricingResult
}>()

const item = computed(() => props.result.displayItem)

const INFLUENCE_BADGES: Record<DisplayInfluence, { label: string, icon?: string }> = {
  'shaper': { label: 'Shaper', icon: '/images/influence-Shaper.png' },
  'elder': { label: 'Elder', icon: '/images/influence-Elder.png' },
  'crusader': { label: 'Crusader', icon: '/images/influence-Crusader.png' },
  'hunter': { label: 'Hunter', icon: '/images/influence-Hunter.png' },
  'redeemer': { label: 'Redeemer', icon: '/images/influence-Redeemer.png' },
  'warlord': { label: 'Warlord', icon: '/images/influence-Warlord.png' },
  'searing-exarch': { label: 'Searing Exarch' },
  'eater-of-worlds': { label: 'Eater of Worlds' }
}

const influenceBadges = computed(() => (item.value?.influences ?? []).map(type => ({
  type,
  ...INFLUENCE_BADGES[type]
})))

const frameRarity = computed(() => {
  const byFrame = ['Normal', 'Magic', 'Rare', 'Unique']
  const fromFrame = props.result.displayItem?.frameType != null
    ? byFrame[props.result.displayItem.frameType]
    : undefined
  if (fromFrame) return fromFrame
  const rarity = props.result.displayItem?.rarity
  return byFrame.includes(rarity ?? '') ? rarity! : 'Normal'
})

const sections = computed(() => {
  const display = item.value
  if (!display) return []
  const result: Array<{ key: string, content?: DisplayItemLine[] }> = [
    { key: 'nameBlock', content: display.nameBlock },
    { key: 'itemProps', content: display.itemProps },
    { key: 'enchantMods', content: display.enchantMods },
    { key: 'implicitMods', content: display.implicitMods },
    {
      key: 'explicitMods',
      content: orderDisplayAffixes([
        display.fracturedMods,
        display.explicitMods,
        display.craftedMods,
        display.veiledMods
      ])
    }
  ]
  for (const [index, tag] of (display.itemTags ?? []).entries()) {
    result.push({ key: `tag-${index}`, content: [tag] })
  }
  return result
})

const dividerVisible = computed(() => sections.value.map((section, index) => {
  return Boolean(section.content?.length) && sections.value.slice(index + 1).some(next => Boolean(next.content?.length))
}))
</script>

<style lang="postcss" module>
.Magic-separator,
.Rare-separator,
.Unique-separator {
  @apply bg-center bg-no-repeat h-1;
}
.Magic-separator { @apply bg-[url(/images/item-display/separator-magic.png)]; }
.Rare-separator { @apply bg-[url(/images/item-display/separator-rare.png)]; }
.Unique-separator { @apply bg-[url(/images/item-display/separator-unique.png)]; }

.Normal-title,
.Magic-title {
  @apply h-[34px];
}
.Rare-title,
.Unique-title {
  @apply h-14;
}
.Normal-title {
  @apply text-normal;
  background-image: url('/images/item-display/normal-left.png'), url('/images/item-display/normal-right.png'), url('/images/item-display/normal-middle.png');
  background-position: top left, top right, top center;
  background-repeat: no-repeat, no-repeat, repeat-x;
  background-size: 29px auto, 29px auto, 29px auto;
}
.Magic-title {
  @apply text-magic;
  background-image: url('/images/item-display/magic-left.png'), url('/images/item-display/magic-right.png'), url('/images/item-display/magic-middle.png');
  background-position: top left, top right, top center;
  background-repeat: no-repeat, no-repeat, repeat-x;
  background-size: 29px auto, 29px auto, 29px auto;
}
.Rare-title {
  @apply text-rare;
  background-image: url('/images/item-display/rare-double-left.png'), url('/images/item-display/rare-double-right.png'), url('/images/item-display/rare-double-middle.png');
  background-position: top left, top right, top center;
  background-repeat: no-repeat, no-repeat, repeat-x;
  background-size: 46px auto, 46px auto, 46px auto;
}
.Unique-title {
  @apply text-unique;
  background-image: url('/images/item-display/unique-double-left.png'), url('/images/item-display/unique-double-right.png'), url('/images/item-display/unique-double-middle.png');
  background-position: top left, top right, top center;
  background-repeat: no-repeat, no-repeat, repeat-x;
  background-size: 46px auto, 46px auto, 46px auto;
}

.influence-shaper { @apply text-blue-200; }
.influence-elder { @apply text-purple-300; }
.influence-crusader { @apply text-red-300; }
.influence-hunter { @apply text-green-300; }
.influence-redeemer { @apply text-blue-300; }
.influence-warlord { @apply text-orange-300; }
.influence-searing-exarch { @apply text-red-300; }
.influence-eater-of-worlds { @apply text-teal-300; }
.influence-mark-searing-exarch {
  @apply bg-red-500;
  box-shadow: 0 0 4px theme('colors.red.500');
}
.influence-mark-eater-of-worlds {
  @apply bg-teal-400;
  box-shadow: 0 0 4px theme('colors.teal.400');
}

.number-color-0 { @apply text-white; }
.number-color-1 { @apply text-indigo-500; }
.number-color-2 { @apply text-red-500; }
.number-color-3 { @apply text-white; }
.number-color-4 { @apply text-red-700; }
.number-color-5 { @apply text-blue-700; }
.number-color-6 { @apply text-yellow-500; }
.number-color-7 { @apply text-pink-800; }
.number-color-8 { @apply text-orange-700; }
.number-color-10 { @apply text-gray-300; }
.number-color-12 { @apply text-blue-300; }
.number-color-8729 {
  @apply text-indigo-300;
}
.number-color-8730 {
  @apply text-orange-300;
}
.number-color-8734 {
  @apply text-blue-400;
}
</style>
