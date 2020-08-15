<template>
  <widget :config="{ ...config, anchor }" move-handles="none" readonly :removable="false">
    <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': `min(${wm.width - wm.poeUiWidth}px, 30rem)` }">
      <div class="bg-gray-900 py-1 px-4 text-center">{{ mapName }}</div>
      <fullscreen-image v-if="image" :src="image" />
      <div v-if="!item" class="px-8 py-2">
        {{ $t('Item under cursor is not a map.') }}
      </div>
      <div v-else class="py-2 flex flex-col">
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
import { TRANSLATED_ITEM_NAME_BY_REF, MAP_IMGS } from '@/assets/data'

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
        return this.$t('Invalid item')
      }

      if (this.item.rarity === ItemRarity.Unique) {
        return TRANSLATED_ITEM_NAME_BY_REF.get(this.item.name || this.item.baseType)
      } else {
        return TRANSLATED_ITEM_NAME_BY_REF.get(this.item.baseType || this.item.name)
      }
    },
    mapStats () {
      return prepareMapStats(this.item)
    },
    image () {
      if (!this.item) return undefined

      const entry = MAP_IMGS.get(this.mapName)
      return entry && entry.img
    }
  }
}
</script>

<i18n>
{
  "ru": {
    "Item under cursor is not a map.": "Предмет под курсором не является картой.",
    "Invalid item": "Неверный предмет"
  }
}
</i18n>
