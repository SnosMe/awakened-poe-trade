<template>
  <div :class="$style.links">
    <div v-for="gem of gems" :class="gem" />
  </div>
</template>

<script setup lang="ts">
import { computed, useCssModule } from 'vue'
import { FilterGroup } from './interfaces'

const props = defineProps<{
  group: FilterGroup
}>()

const $style = useCssModule()

const gems = computed(() => {
  const out: Array<false | string>[] = []
  const supportGems = props.group.stats.filter(stat => stat.mercenary)

  const metaChecked = !props.group.meta.disabled
  const sixlinkChecked = props.group.stats.some(stat => !stat.disabled && (
    (stat.not && supportGems.length === 5) || // current impl force-enables 6-Link group for "Not" filters
    stat.tradeId[0] === 'item.mercenary_6link'
  ))
  out.push([
    $style.skill,
    (supportGems.length === 5) && $style.sixlink,
    metaChecked && sixlinkChecked && $style.checked
  ])

  for (const gem of supportGems) {
    out.push([
      $style.support,
      gem.mercenary!.tier === 3 && $style.tier3,
      gem.mercenary!.tier === 4 && $style.gilded,
      metaChecked && !gem.disabled && $style.checked
    ])
  }
  return out
})
</script>

<style lang="postcss" module>
.links {
  display: flex;
  gap: theme('spacing[2.5]');
  position: relative;
}

.links::before {
  position: absolute;
  content: '';
  height: theme('height[0.5]');
  top: calc(50% - theme('height[0.5]') / 2);
  left: theme('width.1');
  right: theme('width.1');
  background: theme('colors.gray.700');
}

.skill, .support {
  box-sizing: border-box;
  width: theme('width[2.5]');
  height: theme('height[2.5]');
  z-index: 0;
  box-shadow: 0 0 1px 1px rgb(0 0 0 / 50%);

  &.checked {
    outline: 1px solid currentColor;
    outline-offset: 2px;
  }
}

.skill {
  transform: rotate(45deg);
  background: theme('colors.gray.600');
  position: relative;

  &.sixlink {
    background: theme('colors.yellow.500');
  }

  &.sixlink::after {
    position: absolute;
    transform: rotate(-45deg);
    content: '6';
    left: 0; right: 0;
    text-align: center;
    color: theme('colors.black');
    line-height: theme('height[2.5]');
    font-weight: bold;
    font-size: theme('fontSize.xs');
  }
}

.support {
  border-radius: theme('borderRadius.full');
  background: theme('colors.gray.700');

  &.tier3 {
    background: theme('colors.yellow.500');
  }

  &.gilded {
    background: theme('colors.yellow.700');
  }
}
</style>
