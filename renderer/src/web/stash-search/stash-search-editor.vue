<template>
  <div class="max-w-md p-2">
    <input class="bg-surface-base rounded px-1 w-48 mb-2" :placeholder="t('widget.title')"
      v-model="title" />
    <dnd-container tag="div" class="flex flex-col gap-y-2"
      v-model="entries" item-key="id"
      handle="[data-qa=drag-handle]" :animation="200" :force-fallback="true">
      <template #item="{ element: entry }">
        <div class="grid gap-0.5" style="grid-template-columns: auto 1fr auto auto;">
          <button class="leading-none cursor-move bg-surface-hover rounded-l w-6 h-6" data-qa="drag-handle">
            <i class="fas fa-grip-vertical text-content-muted" />
          </button>
          <input v-model="entry.text"
            :placeholder="t('stash_search.search_text')"
            class="px-1 col-span-2 leading-6"
            :class="(entry.text.length > 250) ? 'bg-danger' : 'bg-surface-base'">
          <button class="leading-none rounded-r bg-surface-hover w-6 h-6" @click="removeEntry(entry.id)">
            <i class="fas fa-times text-content-muted" />
          </button>
          <input v-model="entry.name"
            :placeholder="t('stash_search.friendly_name')"
            class="bg-surface-base px-1 col-start-2 leading-6 rounded">
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
import HotkeyInput from '../settings/HotkeyInput.vue'
import { configProp, configModelValue } from '../settings/utils.js'
import type { StashSearchWidget } from './widget.js'

export default defineComponent({
  name: 'stash_search.name',
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
