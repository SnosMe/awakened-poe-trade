<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="flex-1 mb-1">Account name</div>
      <div class="mb-4">
        <input v-model="config.accountName" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Show seller</div>
      <div class="mb-1 flex">
        <ui-radio v-model="config.showSeller" :value="false" class="mr-4">No</ui-radio>
        <ui-radio v-model="config.showSeller" value="account" class="mr-4">Account name</ui-radio>
        <ui-radio v-model="config.showSeller" value="ign">Last character name</ui-radio>
      </div>
      <div class="mb-4 italic text-gray-500">Your items will be highlighted even if it is turned off</div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Fill stat values</div>
      <div class="mb-4 flex">
        <ui-radio v-model="config.searchStatRange" :value="10" class="mr-4">+-10%</ui-radio>
        <ui-radio v-model="config.searchStatRange" :value="0" class="mr-4">Exact roll</ui-radio>
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
