<template>
  <widget v-if="show"
    :config="config" :removable="false" readonly :hideable="false">
    <div class="bg-gray-900 rounded p-1">
      <div class="text-gray-100">Price check</div>
      <textarea type="text" class="px-2 py-1 bg-gray-700 rounded resize-none block" rows="1"
        placeholder="Paste here (Ctrl+V)" @input="handleItemPaste"></textarea>
    </div>
  </widget>
</template>

<script>
import Widget from './Widget'
import { MainProcess } from '@/ipc/main-process-bindings'
import { parseClipboard } from '@/parser'

export default {
  components: { Widget },
  data () {
    return {
      config: {
        anchor: { pos: 'bl', x: 1, y: 98.5 }
      }
    }
  },
  computed: {
    show () {
      return !MainProcess.isElectron
    }
  },
  methods: {
    handleItemPaste (e) {
      const text = e.target.value
      MainProcess.selfEmitPriceCheck({ clipboard: text, position: { x: window.screenX + 100, y: window.screenY + 100 } })
      e.target.value = ''
      // eslint-disable-next-line no-console
      console.log(
        parseClipboard(text)
      )
    }
  }
}
</script>
