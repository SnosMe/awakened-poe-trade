<template>
  <button @click="handleClick"
    class="px-2 leading-none py-2 m-0 text-left flex items-center"
    :class="state === 'danger' ? 'bg-red-700'
          : state === 'warning' ? 'bg-orange-600'
          : state === 'desirable' ? 'bg-green-700'
          : 'hover:bg-gray-700'">
    <template>
      <i v-if="!state"
        class="inline-block mr-2" style="min-width: 1rem;">{{ '\u2009' }}</i>
      <i v-else
        class="fas mr-2 text-center" style="min-width: 1rem;"
        :class="state === 'danger' ? 'fa-skull-crossbones'
          : state === 'warning' ? 'fa-exclamation-triangle'
          : 'fa-check'"></i>
    </template>
    <item-modifier-text :text="stat.text" :roll="stat.roll" class="truncate" />
  </button>
</template>

<script>
import ItemModifierText from '../ui/ItemModifierText'
import { Config } from '@/web/Config'

export default {
  components: { ItemModifierText },
  props: {
    stat: {
      type: Object,
      required: true
    }
  },
  computed: {
    state () {
      return this.entryInSelected && this.entryInSelected.markedAs
    },
    entryInSelected () {
      return this.config.selectedStats.find(_ => _.text === this.stat.ref)
    },
    config () {
      return Config.store.widgets.find(widget => widget.wmType === 'map-check')
    }
  },
  methods: {
    handleClick () {
      if (!this.entryInSelected) {
        this.config.selectedStats.push({
          text: this.stat.ref,
          markedAs: 'danger'
        })
        return
      }

      switch (this.entryInSelected.markedAs) {
        case 'danger':
          this.entryInSelected.markedAs = 'warning'
          break
        case 'warning':
          this.entryInSelected.markedAs = 'desirable'
          break
        case 'desirable':
          this.config.selectedStats = this.config.selectedStats.filter(selected => selected !== this.entryInSelected)
          break
      }
    }
  }
}
</script>
