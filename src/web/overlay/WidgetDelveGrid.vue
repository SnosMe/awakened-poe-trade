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

<script>
import Widget from './Widget'
import { MainProcess } from '@/ipc/main-process-bindings'
import { TOGGLE_DELVE_GRID } from '@/ipc/ipc-event'

export default {
  components: { Widget },
  inject: ['wm'],
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  created () {
    MainProcess.addEventListener(TOGGLE_DELVE_GRID, () => {
      if (this.config.wmWants === 'hide') {
        this.wm.show(this.config.wmId)
      } else {
        this.wm.hide(this.config.wmId)
      }
    })
  },
  computed: {
    anchor () {
      const height = Math.round(this.wm.height * 808 / 1080)
      const width = Math.round(height * 1030 / 808)
      const top = Math.round(this.wm.height * 67 / 1080)
      const cell = Math.round(this.wm.height * 97 / 1080)

      return {
        pos: 'tc',
        y: (top / this.wm.height) * 100,
        x: 50,
        height,
        width,
        cell
      }
    },
    cellSize () {
      return {
        width: `${this.anchor.cell}px`,
        height: `${this.anchor.cell}px`
      }
    }
  }
}
</script>
