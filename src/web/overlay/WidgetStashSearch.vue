<template>
  <widget :config="config" v-slot="{ isEditing }" move-handles="corners">
    <div class="bg-gray-900 p-1 rounded" style="min-width: 15rem;">
      <template>
        <div v-if="!isEditing" class="text-gray-100 m-1 leading-4 truncate">{{ config.wmTitle || 'Untitled' }}</div>
        <input v-else
          class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full"
          placeholder="widget title"
          v-model="config.wmTitle">
      </template>
      <div class="flex flex-col -mb-1 mt-2">
        <dnd-container v-if="isEditing" tag="div" v-model="config.entries" handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
          <div v-for="entry in config.entries" :key="entry.id" class="rounded bg-gray-800 mb-1 flex items-center">
            <button class="p-2 leading-none cursor-move" data-qa="drag-handle">
              <i class="fas fa-grip-vertical text-gray-400"></i>
            </button>
            <div class="relative flex-1" style="min-width: 15rem;">
              <div class="leading-4 py-2 px-2 whitespace-no-wrap">{{ entry.text }}{{ '\u2009' }}</div>
              <input v-model="entry.text"
                placeholder="search text"
                class="absolute top-0 w-full leading-4 text-gray-100 py-2 px-1 bg-gray-700">
            </div>
            <button class="p-2 leading-none" @click="removeEntry(entry.id)">
              <i class="fas fa-times text-gray-600"></i>
            </button>
          </div>
        </dnd-container>
        <template v-else>
          <button v-for="entry in config.entries" :key="entry.id" @click="stashSearch(entry.text)"
            class="leading-4 text-gray-100 p-2 rounded text-left bg-gray-800 mb-1 whitespace-no-wrap">{{ entry.text }}</button>
        </template>
        <button v-if="isEditing" @click="addEntry"
          class="leading-none text-gray-100 p-2 rounded text-left bg-gray-800 mb-1"><i class="fas fa-plus mr-2"></i>Add</button>
      </div>
    </div>
  </widget>
</template>

<script>
import Widget from './Widget'
import DndContainer from 'vuedraggable'
import { MainProcess } from '@/ipc/main-process-bindings'

export default {
  components: { Widget, DndContainer },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  inject: ['wm'],
  data () {
    if (this.config.wmFlags[0] === 'uninitialized') {
      this.config.wmFlags = ['invisible-on-blur']
      this.$set(this.config, 'anchor', {
        pos: 'tl',
        x: 30,
        y: 30
      })
      this.$set(this.config, 'entries', [{
        id: 1, text: 'Currency'
      }])
      this.wm.show(this.config.wmId)
    }

    return {}
  },
  methods: {
    removeEntry (id) {
      this.config.entries = this.config.entries.filter(_ => _.id !== id)
    },
    addEntry () {
      this.config.entries.push({
        id: Math.max(0, ...this.config.entries.map(_ => _.id)) + 1,
        text: ''
      })
    },
    stashSearch (text) {
      MainProcess.stashSearch(text)
    }
  }
}
</script>
