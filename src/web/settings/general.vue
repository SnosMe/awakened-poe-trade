<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">Font size <span class="bg-gray-200 text-gray-900 rounded px-1">Restart required</span></div>
      <div class="mb-4 flex">
        <input v-model.number="config.fontSize" class="rounded bg-gray-900 px-1 block w-16 mb-1 font-fontin-regular text-center" />
        <span class="ml-1">px</span>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Clicking on background focuses game</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.overlayBackgroundClose" :value="false" class="mr-4">No</ui-radio>
        <ui-radio v-model="config.overlayBackgroundClose" :value="true" class="mr-4">Yes</ui-radio>
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Background, when APT window is clickable</div>
      <div class="mb-1 flex">
        <input v-model="config.overlayBackground" class="rounded bg-gray-900 px-1 block w-48 mb-1 mr-4 font-fontin-regular text-center" />
        <ui-radio v-model="config.overlayBackground" value="rgba(255, 255, 255, 0)">Transparent</ui-radio>
      </div>
      <div class="mb-4" v-if="config.overlayBackground !== 'rgba(255, 255, 255, 0)'">
        <ui-radio v-model="config.overlayBackgroundExclusive" :value="true" class="mr-4">Show for Overlay and Price Check</ui-radio><br>
        <ui-radio v-model="config.overlayBackgroundExclusive" :value="false">Show only for Overlay</ui-radio>
      </div>
    </div>
  </div>
</template>

<script>
import { Config } from '@/web/Config'

export default {
  computed: {
    config () {
      return Config.store
    }
  }
}
</script>
