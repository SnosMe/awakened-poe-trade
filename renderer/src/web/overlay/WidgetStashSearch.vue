<template>
  <widget :config="config" v-slot="{ isEditing }" move-handles="corners">
    <div class="widget-default-style p-1" style="min-width: 5rem;">
      <template v-if="true">
        <div v-if="!isEditing" class="text-gray-100 m-1 leading-4 truncate">{{ config.wmTitle || 'Untitled' }}</div>
        <input v-else
          class="leading-4 rounded text-gray-100 p-1 bg-gray-700 w-full"
          :placeholder="t('widget title')"
          v-model="config.wmTitle">
      </template>
      <template v-if="isEditing">
        <dnd-container tag="div" class="flex flex-col gap-y-1 mt-1"
          v-model="config.entries" item-key="id"
          handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
          <template #item="{ element: entry }">
            <div class="rounded bg-gray-800 flex items-center">
              <button class="p-2 leading-none cursor-move" data-qa="drag-handle">
                <i class="fas fa-grip-vertical text-gray-400"></i>
              </button>
              <div class="relative flex-1 mr-2" style="min-width: 15rem;">
                <div class="leading-4 py-2 px-2 whitespace-nowrap">{{ entry.name }}{{ '\u2009' }}</div>
                <input v-model="entry.name"
                  :placeholder="t('entry name')"
                  class="absolute top-0 w-full leading-4 text-gray-100 py-2 px-1"
                  :class="(entry.name?.length > 50) ? 'bg-red-800' : 'bg-gray-700'">
              </div>
              <div class="relative flex-1" style="min-width: 15rem;">
                <div class="leading-4 py-2 px-2 whitespace-nowrap">{{ entry.text }}{{ '\u2009' }}</div>
                <input v-model="entry.text"
                  :placeholder="t('search text')"
                  class="absolute top-0 w-full leading-4 text-gray-100 py-2 px-1"
                  :class="(entry.text.length > 50) ? 'bg-red-800' : 'bg-gray-700'"
                  @blur="handleDataChanged">
              </div>
              <div class="relative flex ml-2 text-gray-100" style="min-width: 5rem;">
                <label class="flex mr-1">Key:</label>
                <hotkey-input v-model="entry.hotkey"
                  v-on:update:model-value="handleDataChanged" class="w-24"/>
              </div>
              <button class="p-2 leading-none" @click="removeEntry(entry.id)">
                <i class="fas fa-times text-gray-600"></i>
              </button>
            </div>
          </template>
        </dnd-container>
        <button @click="addEntry"
          class="leading-none text-gray-100 p-2 rounded text-left bg-gray-800 mt-1 w-full"><i class="fas fa-plus mr-2"></i>{{ t('Add') }}</button>
      </template>
      <div v-else class="flex flex-col gap-y-1 mt-2">
        <button v-for="entry in config.entries" :key="entry.id" @click="stashSearch(entry.text)"
          class="leading-4 text-gray-100 p-2 rounded text-left bg-gray-800 whitespace-nowrap">
            {{!!entry.name ? entry.name : entry.text}}
            <span class="text-gray-500">{{!!entry.hotkey ? `(${entry.hotkey})` : ''}}</span>
        </button>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from './Widget.vue'
import DndContainer from 'vuedraggable'
import { MainProcess } from '@/web/background/IPC'
import { WidgetManager, StashSearchWidget } from './interfaces'
import HotkeyInput from '../settings/HotkeyInput.vue'
import { saveConfig } from '../Config'

export default defineComponent({
  components: { Widget, DndContainer, HotkeyInput },
  props: {
    config: {
      type: Object as PropType<StashSearchWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    if (props.config.wmFlags[0] === 'uninitialized') {
      props.config.wmFlags = ['invisible-on-blur']
      props.config.anchor = {
        pos: 'tl',
        x: (Math.random() * (40 - 20) + 20),
        y: (Math.random() * (40 - 20) + 20)
      }
      props.config.entries = [{
        id: 1, name: 'Currency', text: 'Currency', hotkey: null
      }]
      wm.show(props.config.wmId)
    }

    const { t } = useI18n()

    return {
      t,
      removeEntry (id: number) {
        props.config.entries = props.config.entries.filter(_ => _.id !== id)
      },
      addEntry () {
        props.config.entries.push({
          id: Math.max(0, ...props.config.entries.map(_ => _.id)) + 1,
          name: '',
          text: '',
          hotkey: null
        })
      },
      handleDataChanged () {
        // This manual save is necessary because of update order.
        // Normally config save happens automatically by OverlayWindow when it goes from
        // Overlay active to PoE active. But the new hotkey bindings are loaded before
        // OverlayWindow has the settings saved.
        // This means is always a delay of one "opening" between changing hotkeys and
        // useable hotkeys.
        saveConfig()
      },
      stashSearch (text: string) {
        MainProcess.sendEvent({
          name: 'OVERLAY->MAIN::stash-search',
          payload: { text }
        })
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "entry name": "имя записи",
    "widget title": "заголовок виджета",
    "search text": "текст поиска",
    "hotkey": "Быстрые клавиши"
  }
}
</i18n>
