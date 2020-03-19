<template>
  <div class="max-w-md p-2">
    <!-- <div class="mb-2">
      <div class="flex-1 mb-1">Character name</div>
      <div class="mb-4">
        <input class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div> -->
    <div class="mb-2">
      <div class="flex-1 mb-1">Show seller</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.showSeller" :value="false" class="mr-4">No</ui-radio>
        <ui-radio v-model="config.showSeller" value="account" class="mr-4">Account name</ui-radio>
        <ui-radio v-model="config.showSeller" value="ign">Last character name</ui-radio>
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
