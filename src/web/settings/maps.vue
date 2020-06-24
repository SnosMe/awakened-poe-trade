<template>
  <div class="max-w-md p-2">
    <div class="bg-gray-700 rounded px-2 py-1 mb-2 leading-none">
      <i class="fas fa-info-circle"></i> You can click on stat to cycle through available marks: danger, warning, desirable, none.</div>

    <span class="bg-gray-200 text-gray-800 rounded px-1">Preview Version</span><span> More features and configuration options to come in the next release</span>
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
