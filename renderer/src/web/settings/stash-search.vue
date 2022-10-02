<template>
  <div class="max-w-md p-2">
    <input class="bg-gray-900 rounded px-1 w-48 mb-2" :placeholder="t('widget title')"
      v-model="title" />
    <dnd-container tag="div" class="flex flex-col gap-y-2"
      v-model="entries" item-key="id"
      handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
      <template #item="{ element: entry }">
        <div class="grid gap-0.5" style="grid-template-columns: auto 1fr auto auto;">
          <button class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6" data-qa="drag-handle">
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          <input v-model="entry.text"
            :placeholder="t('search text or regex')"
            class="px-1 col-span-2 leading-6"
            :class="(entry.text.length > 50) ? 'bg-red-800' : 'bg-gray-900'">
          <button class="leading-none rounded-r bg-gray-700 w-6 h-6" @click="removeEntry(entry.id)">
            <i class="fas fa-times text-gray-400" />
          </button>
          <input v-model="entry.name"
            :placeholder="t('friendly name')"
            class="bg-gray-900 px-1 col-start-2 leading-6 rounded">
          <hotkey-input v-model="entry.hotkey" />
        </div>
      </template>
    </dnd-container>
    <button class="btn mt-2" style="min-width: 6rem;"
      @click="addEntry">{{ t('Add') }}</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import DndContainer from 'vuedraggable'
import HotkeyInput from './HotkeyInput.vue'
import { configProp, configModelValue } from './utils'
import type { StashSearchWidget } from '@/web/overlay/interfaces'

export default defineComponent({
  name: 'Stash search',
  components: { DndContainer, HotkeyInput },
  props: configProp<StashSearchWidget>(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      title: configModelValue(() => props.configWidget, 'wmTitle'),
      entries: configModelValue(() => props.configWidget, 'entries'),
      removeEntry (id: number) {
        props.configWidget.entries = props.configWidget.entries.filter(_ => _.id !== id)
      },
      addEntry () {
        props.configWidget.entries.push({
          id: Math.max(0, ...props.configWidget.entries.map(_ => _.id)) + 1,
          text: '',
          name: '',
          hotkey: null
        })
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "widget title": "заголовок виджета",
    "search text or regex": "текст или регекс",
    "friendly name": "нормальное название"
  },
  "zh_CN": {
    "widget title": "组件标题",
    "search text or regex": "搜索文本或正则",
    "friendly name": "易记名称"
  },
  "cmn-Hant": {
    "widget title": "組件標題",
    "search text or regex": "搜索文本或正則",
    "friendly name": "易記名稱"
  }
}
</i18n>
