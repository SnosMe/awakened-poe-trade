<template>
  <widget :config="{ ...config, anchor }" move-handles="none" readonly :removable="false">
    <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': `${wm.width - wm.poeUiWidth}px` }">
      <div class="bg-gray-900 py-1 px-4 text-center">{{ mapName }}</div>
      <div class="bg-gray-700" style="width: 460px; height: 258px;"></div>
      <div v-if="!item" class="px-8 py-2">
        Item under cursor is not a map.
      </div>
      <div v-else class="py-2 pr-8 flex flex-col">
        <map-stat-button v-for="stat in mapStats" :key="stat.text"
          :stat="stat" />
      </div>
    </div>
  </widget>
</template>

<script>
import Widget from '../overlay/Widget'
import { MainProcess } from '@/ipc/main-process-bindings'
import { MAP_CHECK } from '@/ipc/ipc-event'
import { parseClipboard, ItemCategory, ItemRarity } from '@/parser'
import MapStatButton from './MapStatButton'
import { prepareMapStats } from './prepare-map-stats'
// import CheckPositionCircle from './CheckPositionCircle'

export default {
  components: {
    Widget,
    MapStatButton
  },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  created () {
    MainProcess.addEventListener(MAP_CHECK, ({ detail: e }) => {
      this.wm.show(this.config.wmId)
      this.checkPosition = {
        x: e.position.x - window.screenX,
        y: e.position.y - window.screenY
      }
      this.item = null
      const item = parseClipboard(e.clipboard)
      if (item.category === ItemCategory.Map) {
        this.item = item
      }
    })
  },
  inject: ['wm'],
  data () {
    this.config.wmWants = 'hide'

    return {
      checkPosition: { x: 1, y: 1 },
      item: null
    }
  },
  computed: {
    anchor () {
      const side = this.checkPosition.x > (this.wm.width / 2)
        ? 'inventory'
        : 'stash'

      return {
        pos: side === 'stash' ? 'cl' : 'cr',
        y: 50,
        x: side === 'stash'
          ? (this.wm.poeUiWidth / this.wm.width) * 100
          : ((this.wm.width - this.wm.poeUiWidth) / this.wm.width) * 100
      }
    },
    mapName () {
      if (!this.item) {
        return 'Invalid item'
      }

      if (this.item.rarity === ItemRarity.Unique) {
        return this.item.name || this.item.baseType
      } else {
        return this.item.baseType || this.item.name
      }
    },
    mapStats () {
      return prepareMapStats(this.item)
    }
  }
}
</script>
