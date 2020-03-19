<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">Log level <span class="bg-gray-200 text-gray-900 rounded px-1">Restart required</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.logLevel" value="warn" class="mr-4">Warn</ui-radio>
        <ui-radio v-model="config.logLevel" value="debug" class="mr-4">Debug</ui-radio>
        <ui-radio v-model="config.logLevel" value="silly">Silly</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Hardware Acceleration <span class="bg-gray-200 text-gray-900 rounded px-1">Restart required</span></div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.hardwareAcceleration" :value="true" class="mr-4">Enabled</ui-radio>
        <ui-radio v-model="config.hardwareAcceleration" :value="false" class="mr-4">Disabled (render on CPU)</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Shortcut registration</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.useOsGlobalShortcut" :value="true" class="mr-4">OS global (blocking)</ui-radio>
        <ui-radio v-model="config.useOsGlobalShortcut" :value="false" class="mr-4">Hook (non-blocking)</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">PoE window title</div>
      <div class="mb-4">
        <input v-model="config.windowTitle" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div>
  </div>
</template>

<script>
import { Config } from '../Config'

export default {
  computed: {
    config () {
      return Config.store
    }
  }
}
</script>
