<template>
  <div class="p-8 flex-grow layout-column">
    <div>
      <textarea type="text" class="px-2 py-1 bg-gray-700 rounded resize-none" rows="1"
        placeholder="Paste here (Ctrl+V)" @input="handleItemPaste"></textarea>
    </div>
    <pre class="text-gray-600 overflow-x-hidden flex-1">{{ item }}</pre>
  </div>
</template>

<script>
import { MainProcess } from './main-process-bindings'
import { parseClipboard } from './parser'

export default {
  data () {
    return {
      item: null
    }
  },
  methods: {
    handleItemPaste (e) {
      const text = e.target.value
      MainProcess.selfEmitPriceCheck(text)
      e.target.value = ''
      this.item = parseClipboard(text)
    }
  }
}
</script>
