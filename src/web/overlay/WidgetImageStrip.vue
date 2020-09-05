<template>
  <widget :config="config" v-slot="{ isEditing, isMoving }" move-handles="top-bottom">
    <div class="widget-default-style p-1" style="min-width: 5rem;">
      <template>
        <div v-if="!isEditing" class="text-gray-100 m-1 leading-4 text-center">{{ config.wmTitle || 'Untitled' }}</div>
        <input v-else
          class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full mb-1"
          :placeholder="$t('widget title')"
          v-model="config.wmTitle">
      </template>
      <div class="flex -ml-1">
        <dnd-container tag="div" v-model="config.images" handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true" class="flex">
          <div v-for="(img, idx) in config.images" :key="idx"
            :class="$style.card">
            <fullscreen-image
              :src="img.url"
              :disabled="isEditing || isMoving"
              class="rounded overflow-hidden" />
            <button v-if="isEditing" @click="remove(img)"
              class="bg-gray-800 absolute top-0 right-0 rounded-bl text-red-500 leading-none px-2 py-1 flex"><i class="fas fa-times"></i></button>
            <button v-if="isEditing" data-qa="drag-handle"
              class="bg-gray-900 absolute rounded text-gray-400 leading-none w-8 h-8 flex justify-center items-center cursor-move" style="top: calc(50% - 1rem); left: calc(50% - 1rem);"><i class="fas fa-arrows-alt"></i></button>
          </div>
        </dnd-container>
        <div v-if="isEditing"
          :class="$style.card" class="flex justify-center items-center">
          <input type="file" id="file" class="hidden" accept="image/*" @input="handleFile">
          <label class="text-gray-400 hover:bg-gray-700 py-1 px-2 rounded cursor-pointer" for="file"><i class="fas fa-file-import"></i> {{ $t('Choose File') }}</label>
        </div>
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
        pos: 'tc',
        x: 50,
        y: 10
      })
      this.$set(this.config, 'images', [{
        url: 'syndicate.jpg'
      }])
      this.wm.show(this.config.wmId)
    }

    return {}
  },
  methods: {
    handleFile (e) {
      this.config.images.push({
        url: MainProcess.importFile(e.target.files[0].path)
      })
      e.target.value = ''
    },
    remove (img) {
      this.config.images = this.config.images.filter(_ => _ !== img)
    }
  }
}
</script>

<style lang="postcss" module>
.card {
  width: 12rem;
  height: 6.5rem;
  @apply ml-1 p-1;
  @apply bg-gray-800;
  @apply rounded;
  position: relative;
}
</style>

<i18n>
{
  "ru": {
    "widget title": "заголовок виджета",
    "Choose File": "Выберите файл"
  }
}
</i18n>
