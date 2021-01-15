<template>
  <widget :config="{ anchor }" move-handles="none" readonly :removable="false">
    <div class="relative overflow-hidden"
      :style="{
        width: `${anchor.width}px`,
        height: `${anchor.height}px`,
        background: 'rgba(255,255,255,0.1)'
      }">
      <div
        class="absolute"
        :style="{
          top: `${(anchor.height - anchor.cell * 9) / 2}px`,
          left: `${(anchor.width - anchor.cell * 11) / 2}px`
        }">
          <div v-for="i in 9" :key="i" class="flex">
            <div v-for="j in 11" :key="j"
              class="border border-gray-600"
              :style="cellSize" />
          </div>
        </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue'
import Widget from './Widget.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import { TOGGLE_DELVE_GRID } from '@/ipc/ipc-event'
import { Widget as IWidget, WidgetManager } from './interfaces'

export default defineComponent({
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<IWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    MainProcess.addEventListener(TOGGLE_DELVE_GRID, () => {
      if (props.config.wmWants === 'hide') {
        wm.show(props.config.wmId)
      } else {
        wm.hide(props.config.wmId)
      }
    })

    const anchor = computed(() => {
      const height = Math.round(wm.height * 808 / 1080)
      const width = Math.round(height * 1030 / 808)
      const top = Math.round(wm.height * 67 / 1080)
      const cell = Math.round(wm.height * 97 / 1080)

      return {
        pos: 'tc',
        y: (top / wm.height) * 100,
        x: 50,
        height,
        width,
        cell
      }
    })

    const cellSize = computed(() => {
      return {
        width: `${anchor.value.cell}px`,
        height: `${anchor.value.cell}px`
      }
    })

    return {
      anchor,
      cellSize
    }
  }
})
</script>
