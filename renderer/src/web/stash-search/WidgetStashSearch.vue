<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0" style="min-width: 5rem;">
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle || 'Untitled' }}</span>
        <ui-toggle v-if="hasHotkeys"
          v-model="config.enableHotkeys">{{ t('stash_search.enable_keys') }}</ui-toggle>
      </div>
      <div class="flex flex-col gap-y-1 overflow-y-auto min-h-0">
        <button v-for="entry in config.entries" :key="entry.id"
          @click="stashSearch(entry.text)" :class="$style.searchBtn">
          <span>{{ entry.name || entry.text }}</span>
          <span v-if="entry.hotkey && config.enableHotkeys"
            :class="$style.hotkey">{{ entry.hotkey }}</span>
        </button>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '../overlay/interfaces.js'
import type { StashSearchWidget } from './widget.js'

export default {
  widget: {
    type: 'stash-search',
    instances: 'multi',
    trNameKey: 'stash_search.name',
    defaultInstances: (): StashSearchWidget[] => {
      return [{
        wmId: 0,
        wmType: 'stash-search',
        wmTitle: 'Map rolling',
        wmWants: 'hide',
        wmZorder: null,
        wmFlags: ['invisible-on-blur'],
        anchor: {
          pos: 'tl',
          x: 35,
          y: 46
        },
        enableHotkeys: true,
        entries: [
          { id: 1, name: '', text: '"Pack Size: +3"', hotkey: null },
          { id: 2, name: '', text: 'Reflect', hotkey: null },
          { id: 3, name: '', text: '"Cannot Leech Life"', hotkey: null },
          { id: 4, name: '', text: '"Cannot Leech Mana"', hotkey: null }
        ]
      }, {
        wmId: 0,
        wmType: 'stash-search',
        wmTitle: 'Dump sorting',
        wmWants: 'hide',
        wmZorder: null,
        wmFlags: ['invisible-on-blur'],
        anchor: {
          pos: 'tl',
          x: 34,
          y: 56
        },
        enableHotkeys: true,
        entries: [
          { id: 1, name: '', text: 'Currency', hotkey: null },
          { id: 2, name: '', text: '"Divination Card"', hotkey: null },
          { id: 3, name: '', text: 'Fossil', hotkey: null },
          { id: 4, name: '', text: '"Map Tier"', hotkey: null },
          { id: 5, name: '', text: '"Map Device" "Rarity: Normal"', hotkey: null },
          { id: 6, name: '', text: 'Tane Laboratory', hotkey: null }
        ]
      }]
    }
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MainProcess } from '@/web/background/IPC'
import { pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '../overlay/interfaces.js'

import Widget from '../overlay/Widget.vue'
import UiToggle from '@/web/ui/UiToggle.vue'

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

<style lang="postcss" module>
.searchBtn {
  flex-shrink: 0;
  @apply rounded;
  @apply max-w-sm;
  @apply p-2 leading-4;
  @apply text-gray-100 bg-gray-800;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &:hover {
    @apply bg-gray-700;
  }
}

.hotkey {
  text-align: center;
  display: inline-block;
  @apply text-black bg-gray-400;
  @apply rounded;
  @apply px-1 ml-1;
}
</style>
