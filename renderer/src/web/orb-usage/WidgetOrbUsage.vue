<template>
  <Widget :config="config" move-handles="corners" :inline-edit="false">
    <div class="widget-default-style p-1 flex flex-col overflow-y-auto min-h-0" style="min-width: 12rem;">
      <div class="text-gray-100 p-1 flex items-center justify-between gap-4">
        <span class="truncate">{{ config.wmTitle || 'Orb Usage' }}</span>
        <div class="flex items-center gap-2">
          <!-- Status indicator -->
          <div 
            :class="[
              'w-2 h-2 rounded-full',
              config.isRunning ? 'bg-green-500' : 'bg-gray-600'
            ]"
            :title="config.isRunning ? 'Running' : 'Idle'"
          ></div>
          <!-- Last operation indicator -->
          <span 
            class="text-xs px-1 py-0.5 rounded"
            :class="getOperationClass(config.lastOperation)"
          >
            {{ getOperationText(config.lastOperation) }}
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-y-2 overflow-y-auto min-h-0 p-2">
        
        <!-- Mode Toggle -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Mode</label>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="config.stashMode"
                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                @change="saveConfig"
              />
              <span class="text-sm text-gray-300">
                {{ config.stashMode ? 'Stash Processing' : 'Single Item (Cursor)' }}
              </span>
            </label>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            F10: {{ config.stashMode ? 'Process Stash' : 'Process Item at Cursor' }}<br/>
            Ctrl+F10: Force Stash Process<br/>
            F11: Stop Operation<br/>
            <span v-if="config.useCustomColors" class="text-blue-300">
              ; (semicolon): Analyze matched item color at cursor<br/>
              ' (apostrophe): Analyze unmatched item color at cursor
            </span>
          </div>
        </div>

        <!-- Color Detection Mode -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Color Detection</label>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="config.useCustomColors"
                class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                @change="saveConfig"
              />
              <span class="text-sm text-gray-300">
                {{ config.useCustomColors ? 'Custom Colors' : 'Default (Map Rolling)' }}
              </span>
            </label>
          </div>
        </div>

        <!-- Custom Color Configuration -->
        <div v-if="config.useCustomColors" class="flex flex-col gap-2 p-2 bg-gray-800 rounded">
          <div class="text-sm text-gray-300 font-medium">Custom Color Thresholds</div>
          
          <!-- Scan Area Size -->
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-400">Scan Area Size (px)</label>
            <input
              v-model.number="config.scanAreaSize"
              type="number"
              min="20"
              max="100"
              step="2"
              class="w-20 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
              @input="saveConfig"
            />
          </div>

          <!-- Matched (Colored) Items -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-300">Matched Items (Colored)</span>
              <div class="text-xs text-blue-400 font-mono">Ctrl J</div>
            </div>
            <div class="flex gap-2">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-xs text-gray-400">Saturation</label>
                <input
                  v-model.number="config.customColorThresholds.matched.saturation"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  @input="saveConfig"
                />
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-xs text-gray-400">Value</label>
                <input
                  v-model.number="config.customColorThresholds.matched.value"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  @input="saveConfig"
                />
              </div> 
            </div>
          </div>

          <!-- Unmatched (Grey) Items -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-300">Unmatched Items (Grey)</span>
              <div class="text-xs text-blue-400 font-mono">Alt J</div>
            </div>
            <div class="flex gap-2">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-xs text-gray-400">Saturation</label>
                <input
                  v-model.number="config.customColorThresholds.unmatched.saturation"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  @input="saveConfig"
                />
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-xs text-gray-400">Value</label>
                <input
                  v-model.number="config.customColorThresholds.unmatched.value"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  @input="saveConfig"
                />
              </div>
            </div>
          </div>

          <div class="text-xs text-gray-400 mt-1">
            Hover over an item and press the hotkey to analyze its colors:<br/>
            <span class="text-blue-400 font-mono">Ctrl J</span> for matched items, <span class="text-blue-400 font-mono">Alt J</span> for unmatched items
          </div>
        </div>

        <!-- Max Attempts -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Max Attempts</label>
          <input
            v-model.number="config.maxAttempts"
            type="number"
            min="1"
            max="10"
            class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
            @input="saveConfig"
          />
        </div>

        <!-- Stash Grid -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Stash Grid</label>
          <div class="flex gap-1 items-center">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">Width</label>
              <input
                v-model.number="config.stashGrid.width"
                type="number"
                min="1"
                max="12"
                class="w-16 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                @input="saveConfig"
              />
            </div>
            <span class="text-gray-400 mt-4">×</span>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">Height</label>
              <input
                v-model.number="config.stashGrid.height"
                type="number"
                min="1"
                max="12"
                class="w-16 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                @input="saveConfig"
              />
            </div>
          </div>
        </div>

        <!-- Item Grid -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Item Grid</label>
          <div class="flex gap-1 items-center">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">Width</label>
              <input
                v-model.number="config.itemGrid.width"
                type="number"
                min="1"
                max="6"
                class="w-16 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                @input="saveConfig"
              />
            </div>
            <span class="text-gray-400 mt-4">×</span>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-400">Height</label>
              <input
                v-model.number="config.itemGrid.height"
                type="number"
                min="1"
                max="6"
                class="w-16 px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
                @input="saveConfig"
              />
            </div>
          </div>
        </div>

        <!-- Delay Between Items -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Delay Between Items (ms)</label>
          <input
            v-model.number="config.delayBetweenItems"
            type="number"
            min="0"
            max="5000"
            step="50"
            class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
            @input="saveConfig"
          />
        </div>

        <!-- Delay Between Rounds -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-300">Delay Between Rounds (ms)</label>
          <input
            v-model.number="config.delayBetweenRounds"
            type="number"
            min="0"
            max="5000"
            step="50"
            class="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none"
            @input="saveConfig"
          />
        </div>

        <!-- Save Button -->
        <div class="flex flex-col gap-2 mt-2">
          <button
            @click="saveConfiguration"
            class="px-3 py-2 rounded font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Configuration
          </button>
          
          <div class="text-xs text-gray-400 text-center">
            Configuration will be applied to shortcuts<br/>
            Use F10, Ctrl+F10, F11 to control orb usage
          </div>
        </div>
      </div>
    </div>
  </Widget>
</template>

<script lang="ts">
import type { WidgetSpec } from '../overlay/interfaces.js'
import type { OrbUsageWidget } from './widget.js'

export default {
  widget: {
    type: 'orb-usage',
    instances: 'multi',
    trNameKey: 'orb_usage.name',
    defaultInstances: (): OrbUsageWidget[] => {
      return [{
        wmId: 0,
        wmType: 'orb-usage',
        wmTitle: 'Orb Usage',
        wmWants: 'show',
        wmZorder: null,
        wmFlags: ['invisible-on-blur'],
        anchor: {
          pos: 'tl',
          x: 50,
          y: 50
        },
        maxAttempts: 1,
        stashGrid: { width: 12, height: 12 },
        itemGrid: { width: 1, height: 1 },
        delayBetweenItems: 150,
        delayBetweenRounds: 300,
        stashMode: true,
        isRunning: false,
        lastOperation: 'none',
        useCustomColors: false,
        customColorThresholds: {
          matched: { saturation: 45, value: 65 },
          unmatched: { saturation: 30, value: 36 }
        },
        scanAreaSize: 58
      }]
    }
  } satisfies WidgetSpec
}
</script>

<script setup lang="ts">
import { inject, ref, onMounted } from 'vue'
import { MainProcess } from '@/web/background/IPC'
import { pushHostConfig } from '@/web/Config'
import type { WidgetManager } from '../overlay/interfaces.js'

import Widget from '../overlay/Widget.vue'

const props = defineProps<{
  config: OrbUsageWidget
}>()

const wm = inject<WidgetManager>('wm')!

// Listen for status updates from main process
onMounted(() => {
  MainProcess.onEvent('MAIN->CLIENT::orb-usage-status', (e) => {
    props.config.isRunning = e.isRunning
    props.config.lastOperation = e.lastOperation
    console.log('Orb usage status update:', e)
  })

  // Listen for color capture results from hotkeys
  MainProcess.onEvent('MAIN->CLIENT::color-capture-result', (e) => {
    if (e.captureType === 'matched') {
      props.config.customColorThresholds.matched = {
        saturation: e.saturation,
        value: e.value
      }
    } else if (e.captureType === 'unmatched') {
      props.config.customColorThresholds.unmatched = {
        saturation: e.saturation,
        value: e.value
      }
    }
    saveConfig()
    console.log('Color capture completed via hotkey:', e)
  })
})

if (props.config.wmFlags[0] === 'uninitialized') {
  props.config.wmFlags = ['invisible-on-blur']
  props.config.anchor = {
    pos: 'tl',
    x: 50,
    y: 50
  }
  props.config.maxAttempts = 1
  props.config.stashGrid = { width: 12, height: 12 }
  props.config.itemGrid = { width: 1, height: 1 }
  props.config.delayBetweenItems = 150
  props.config.delayBetweenRounds = 300
  props.config.stashMode = true
  props.config.isRunning = false
  props.config.lastOperation = 'none'
  props.config.useCustomColors = false
  props.config.customColorThresholds = {
    matched: { saturation: 45, value: 65 },
    unmatched: { saturation: 30, value: 36 }
  }
  props.config.scanAreaSize = 58
  wm.show(props.config.wmId)
}

function saveConfig (): void {
  // This saves the widget config but doesn't update shortcuts
  pushHostConfig()
}

function saveConfiguration (): void {
  // Save the widget config and update host config with shortcuts
  console.log('Saving orb usage configuration:', {
    maxAttempts: props.config.maxAttempts,
    stashGrid: props.config.stashGrid,
    itemGrid: props.config.itemGrid,
    delayBetweenItems: props.config.delayBetweenItems,
    delayBetweenRounds: props.config.delayBetweenRounds,
    stashMode: props.config.stashMode,
    useCustomColors: props.config.useCustomColors,
    customColorThresholds: props.config.customColorThresholds,
    scanAreaSize: props.config.scanAreaSize
  })

  // Send event to update shortcuts in main process
  MainProcess.sendEvent({
    name: 'CLIENT->MAIN::orb-usage-action',
    payload: {
      action: 'save-config',
      config: {
        maxAttempts: props.config.maxAttempts,
        stashGrid: props.config.stashGrid,
        itemGrid: props.config.itemGrid,
        delayBetweenItems: props.config.delayBetweenItems,
        delayBetweenRounds: props.config.delayBetweenRounds,
        stashMode: props.config.stashMode,
        useCustomColors: props.config.useCustomColors,
        customColorThresholds: props.config.customColorThresholds,
        scanAreaSize: props.config.scanAreaSize
      }
    }
  })

  pushHostConfig()
}



function getOperationClass (operation: string): string {
  switch (operation) {
    case 'single': return 'bg-blue-600 text-white'
    case 'stash': return 'bg-green-600 text-white'
    case 'analyze': return 'bg-yellow-600 text-black'
    default: return 'bg-gray-600 text-gray-300'
  }
}

function getOperationText (operation: string): string {
  switch (operation) {
    case 'single': return 'Single'
    case 'stash': return 'Stash'
    case 'analyze': return 'Analyze'
    default: return 'None'
  }
}
</script>

<style scoped>
/* Additional styles if needed */
</style> 