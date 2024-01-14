<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0" style="min-width: 5rem;">
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle || 'Untitled' }}</span>
        <ui-toggle v-if="hasHotkeys"
          v-model="config.enableHotkeys">{{ t('stash_search.enable_keys') }}</ui-toggle>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <button v-for="entry in config.entries" :key="entry.id" @click="stashSearch(entry.text)"
          class="leading-4 text-gray-100 p-2 rounded text-left bg-gray-800 whitespace-nowrap truncate shrink-0 max-w-sm">
            {{ entry.name || entry.text }}
            <span v-if="entry.hotkey && config.enableHotkeys"
              class="text-center inline-block text-black bg-gray-400 rounded px-1">{{ entry.hotkey }}</span>
        </button>
      </div>
    </div>
  </Widget>
</template>

<script setup lang="ts">
import { inject, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MainProcess } from '@/web/background/IPC'
import { pushHostConfig } from '@/web/Config'
import { WidgetManager, StashSearchWidget } from './interfaces'

import Widget from './Widget.vue'

const props = defineProps<{
  config: StashSearchWidget
}>()

const wm = inject<WidgetManager>('wm')!

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.anchor = {
    pos: 'tl',
    x: (Math.random() * (40 - 20) + 20),
    y: (Math.random() * (40 - 20) + 20)
  }
  props.config.enableHotkeys = true
  props.config.entries = [{
    id: 1, text: 'Currency', name: '', hotkey: null
  }]
  wm.show(props.config.wmId)
}

function stashSearch (text: string) {
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'stash-search', text }
  })
}

const hasHotkeys = computed(() => props.config
  .entries.some(entry => entry.hotkey != null))

watch(() => props.config.enableHotkeys, () => {
  pushHostConfig()
})

const { t } = useI18n()
</script>
