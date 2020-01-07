<template>
  <div class="titlebar">
    <div class="flex">
      <button class="button" title="Settings"><i class="fas fa-cog"></i></button>
      <button class="button" title="Update price data"><i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i></button>
      <button class="button" title="Close all"><i class="fas fa-times-circle"></i></button>
    </div>
    <div class="text-gray-600 truncate leading-none px-4">Awakened PoE Trade</div>
    <div class="flex">
      <button tabindex="-1" class="button" title="Lock"><i class="fas fa-unlock"></i></button>
      <button tabindex="-1" class="button" title="Minimize"><i class="fas fa-window-minimize"></i></button>
      <button tabindex="-1" class="button" title="Close"><i class="fas fa-window-close"></i></button>
    </div>
  </div>
</template>

<script>
import { Leagues } from './Leagues'
import { Prices } from './Prices'

export default {
  name: 'AppTitlebar',
  computed: {
    isLoading: () => Leagues.isLoading || Prices.isLoading
  }
}
</script>

<style lang="postcss">
.titlebar {
  /* https://electronjs.org/docs/api/frameless-window */
  -webkit-app-region: drag;
  user-select: none;
  @apply bg-gray-900;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.titlebar .button {
  -webkit-app-region: no-drag;
  @apply text-gray-600;
  line-height: 1;
  @apply p-1;

  &:hover {
    @apply text-gray-500;
  }
}
</style>
