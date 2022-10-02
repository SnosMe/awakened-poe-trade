<template>
  <widget :config="config" v-slot="{ isEditing, isMoving }" move-handles="top-bottom">
    <div class="widget-default-style p-1" style="min-width: 5rem;">
      <template v-if="true">
        <div v-if="!isEditing" class="text-gray-100 m-1 leading-4 text-center">{{ config.wmTitle || 'Untitled' }}</div>
        <input v-else
          class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full mb-1"
          :placeholder="t('widget title')"
          v-model="config.wmTitle">
      </template>
      <dnd-container tag="div" class="flex gap-x-1"
        v-model="config.images" item-key="id"
        handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
        <template #item="{ element: img }">
          <div :class="$style.card">
            <fullscreen-image
              :src="img.url"
              :disabled="isEditing || isMoving"
              class="rounded overflow-hidden" />
            <button v-if="isEditing" @click="remove(img.id)"
              class="bg-gray-800 absolute top-0 right-0 rounded-bl text-red-500 leading-none px-2 py-1 flex"><i class="fas fa-times"></i></button>
            <button v-if="isEditing" data-qa="drag-handle"
              class="bg-gray-900 absolute rounded text-gray-400 leading-none w-8 h-8 flex justify-center items-center cursor-move" style="top: calc(50% - 1rem); left: calc(50% - 1rem);"><i class="fas fa-arrows-alt"></i></button>
          </div>
        </template>
        <template #footer v-if="isEditing">
          <div :class="$style.card" class="flex justify-center items-center">
            <input type="file" id="file" class="hidden" accept="image/*" @input="handleFile">
            <label class="text-gray-400 hover:bg-gray-700 py-1 px-2 rounded cursor-pointer" for="file"><i class="fas fa-file-import"></i> {{ t('Choose File') }}</label>
          </div>
        </template>
      </dnd-container>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from './Widget.vue'
import DndContainer from 'vuedraggable'
import { MainProcess } from '@/web/background/IPC'
import { WidgetManager, ImageStripWidget } from './interfaces'

export default defineComponent({
  components: { Widget, DndContainer },
  props: {
    config: {
      type: Object as PropType<ImageStripWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    if (props.config.wmFlags[0] === 'uninitialized') {
      props.config.wmFlags = ['invisible-on-blur']
      props.config.anchor = {
        pos: 'tc',
        x: (Math.random() * (60 - 40) + 40),
        y: (Math.random() * (15 - 5) + 5)
      }
      props.config.images = [{
        id: 1, url: 'syndicate.jpg'
      }]
      nextTick(() => {
        wm.show(props.config.wmId)
      })
    }

    const { t } = useI18n()

    return {
      t,
      handleFile (e: Event) {
        const target = (e as InputEvent).target as HTMLInputElement
        props.config.images.push({
          id: Math.max(0, ...props.config.images.map(_ => _.id)) + 1,
          url: MainProcess.importFile(target.files![0].path)!
        })
        target.value = ''
      },
      remove (id: number) {
        props.config.images = props.config.images.filter(_ => _.id !== id)
      }
    }
  }
})
</script>

<style lang="postcss" module>
.card {
  width: 12rem;
  height: 6.5rem;
  @apply p-1;
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
  },
  "cmn-Hant": {
    "widget title": "組件標題",
    "Choose File": "選擇文件"
  },
  "zh_CN": {
    "widget title": "组件标题",
    "Choose File": "选择文件"
  }
}
</i18n>
