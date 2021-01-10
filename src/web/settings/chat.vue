<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="mb-4" v-for="command in commands">
        <input v-model.trim="command.text" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
        <div class="flex justify-end">
          <button @click="removeCommand(command)" class="mr-2 text-gray-500">{{ $t('Remove') }}</button>
          <hotkey-input v-model="command.hotkey" class="w-48" />
        </div>
      </div>
      <button @click="addComand" class="bg-gray-900 rounded flex items-baseline px-2 py-1 leading-none"><i class="fas fa-plus mr-1"></i> {{ $t('Add command') }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import HotkeyInput from './HotkeyInput.vue'
import { Config } from '@/web/Config'
import { Config as IConfig } from '@/ipc/types'

export default {
  components: { HotkeyInput },
  setup () {
    return {
      commands: computed(() => Config.store.commands),
      addComand () {
        Config.store.commands.push({
          text: '',
          hotkey: null
        })
      },
      removeCommand (command: IConfig['commands'][number]) {
        Config.store.commands = Config.store.commands.filter(c => c !== command)
      }
    }
  }
}
</script>

<i18n>
{
  "ru": {
    "Add command": "Добавить команду"
  }
}
</i18n>
