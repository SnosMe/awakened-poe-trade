<template>
  <widget v-if="show"
    :config="config" :removable="false" readonly :hideable="false">
    <div class="widget-default-style p-1 text-gray-100">
      <ui-toggle v-model="active" class="mb-1">Overlay active</ui-toggle>
      <textarea class="px-2 py-1 bg-gray-700 rounded resize-none block" rows="1"
        placeholder="Price check (Ctrl+V)" @input="handleItemPaste"></textarea>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, inject, reactive, computed } from 'vue'
import { WidgetManager, Anchor } from './interfaces'
import Widget from './Widget.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { parseClipboard } from '@/parser'

export default defineComponent({
  components: { Widget },
  setup () {
    const wm = inject<WidgetManager>('wm')!

    const config = reactive({
      anchor: { pos: 'bl', x: 1, y: 98.5 } as Anchor
    })

    return {
      config,
      show: computed(() => {
        return !MainProcess.isElectron
      }),
      active: computed<boolean>({
        get () { return wm.active },
        set (value) { wm.active = value }
      }),
      handleItemPaste (e: InputEvent) {
        const target = e.target as HTMLInputElement
        const text = target.value
        MainProcess.selfEmitPriceCheck({ clipboard: text, position: { x: window.screenX + 100, y: window.screenY + 100 }, lockedMode: false })
        target.value = ''
        // eslint-disable-next-line no-console
        console.log(
          parseClipboard(text)
        )
      }
    }
  }
})
</script>
