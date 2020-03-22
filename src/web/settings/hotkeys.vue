<template>
  <div class="max-w-md p-2">
    <div class="mb-8">
      <div class="flex">
        <div class="flex-1">Price check</div>
        <div class="flex">
          <span class="text-gray-500 mr-2">Auto-hide Mode</span>
          <button :class="{ border: config.priceCheckKeyHold === 'Ctrl' }" @click="config.priceCheckKeyHold = 'Ctrl'" class="rounded px-1 bg-gray-900 leading-none mr-1">Ctrl</button>
          <button :class="{ border: config.priceCheckKeyHold === 'Shift' }" @click="config.priceCheckKeyHold = 'Shift'" class="rounded px-1 bg-gray-900 leading-none">Shift</button>
          <span class="mx-3">+</span>
          <hotkey-input v-model="config.priceCheckKey" :forbidden="['Ctrl','Shift','Alt','C','V']" required class="w-20" />
        </div>
      </div>
      <div class="text-right mt-2">
        <span class="text-gray-500 mr-2">Open without auto-hide</span>
        <hotkey-input v-model="config.priceCheckLocked" :forbidden="['C','V']" class="w-48" />
      </div>
    </div>
    <div class="mb-8">
      <div class="flex">
        <div class="flex-1">Open wiki</div>
        <hotkey-input v-model="config.wikiKey" :forbidden="['C','V']" class="w-48" />
      </div>
    </div>
    <div class="mb-2">
      <div class="flex-1 mb-1">Custom commands</div>
      <div class="mb-4" v-for="(command, idx) in config.commands" :key="idx">
        <input v-model="command.text" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
        <div class="flex justify-end">
          <button @click="removeCommand(command)" class="mr-2 text-gray-500">Remove</button>
          <hotkey-input v-model="command.hotkey" :forbidden="['C','V']" class="w-48" />
        </div>
      </div>
      <button @click="addComand" class="bg-gray-900 rounded flex items-baseline px-2 py-1 leading-none"><i class="fas fa-plus mr-1"></i> Add command</button>
    </div>
  </div>
</template>

<script>
import HotkeyInput from './HotkeyInput'
import { Config } from '@/web/Config'

export default {
  components: { HotkeyInput },
  computed: {
    config () {
      return Config.store
    }
  },
  methods: {
    addComand () {
      this.config.commands.push({
        name: '',
        hotkey: null
      })
    },
    removeCommand (command) {
      this.config.commands = this.config.commands.filter(c => c !== command)
    }
  }
}
</script>
