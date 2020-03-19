<template>
  <div class="flex-grow layout-column bg-gray-800">
    <app-titlebar @close="cancel" title="Settings" native />
    <div class="flex flex-grow min-h-0">
      <div class="px-2 pb-10 bg-gray-900 flex flex-col">
        <router-link :to="{ name: 'settings.hotkeys' }" class="menu-item">Hotkeys</router-link>
        <router-link :to="{ name: 'settings.general' }" class="menu-item">General</router-link>
        <router-link :to="{ name: 'settings.debug' }" class="menu-item">Debug</router-link>
        <div style="min-width: 150px;"></div>
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
import AppTitlebar from '../AppTitlebar'
import { Config } from '../Config'
import { MainProcess } from '../main-process-bindings'

export default {
  components: { AppTitlebar },
  beforeCreate () {
    document.title = 'Settings'
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
  padding: 8px;
  line-height: 1;
  @apply text-gray-600;
  @apply rounded;
  margin-bottom: 2px;

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
