<template>
  <div class="flex-grow layout-column bg-gray-800">
    <app-titlebar @close="cancel" title="Settings - Awakened PoE Trade" native />
    <div class="flex flex-grow min-h-0">
      <div class="px-2 pb-10 bg-gray-900 flex flex-col">
        <router-link :to="{ name: 'settings.hotkeys' }" class="menu-item">Hotkeys</router-link>
        <router-link :to="{ name: 'settings.general' }" class="menu-item">General</router-link>
        <router-link :to="{ name: 'settings.price-check' }" class="menu-item">Price check</router-link>
        <router-link :to="{ name: 'settings.maps' }" class="menu-item">Maps</router-link>
        <router-link :to="{ name: 'settings.debug' }" class="menu-item">Debug</router-link>
        <div style="min-width: 9.5rem;"></div>
      </div>
      <div class="text-gray-100 flex-grow layout-column">
        <div class="flex-grow overflow-y-auto">
          <router-view />
        </div>
        <div class="border-t bg-gray-900 border-gray-600 p-2 flex justify-end">
          <button @click="save" class="px-3 bg-gray-800 rounded mr-2">Save</button>
          <button @click="cancel" class="px-3">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Config } from '@/web/Config'
import { MainProcess } from '@/ipc/main-process-bindings'

export default {
  beforeCreate () {
    document.title = 'Settings - Awakened PoE Trade'
  },
  methods: {
    save () {
      MainProcess.closeSettingsWindow(Config.store)
    },
    cancel () {
      MainProcess.closeSettingsWindow()
    }
  }
}
</script>

<style lang="postcss">
.menu-item {
  text-align: left;
  @apply p-2;
  line-height: 1;
  @apply text-gray-600;
  @apply rounded;
  margin-bottom: 0.125rem;

  &:hover {
    @apply text-gray-100;
  }

  &.active {
    @apply font-fontin-bold;
    @apply text-gray-400;
    @apply bg-gray-800;
  }
}
</style>
