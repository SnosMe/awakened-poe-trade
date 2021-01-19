<template>
  <div class="max-w-md p-2">
    <div class="mb-2">
      <div class="mb-4" v-for="command in commands">
        <input v-model.trim="command.text" class="rounded bg-gray-900 px-1 block w-full mb-1 font-fontin-regular" />
        <div class="flex">
          <ui-toggle v-model="command.send" class="ml-1">{{ t('press Enter') }}</ui-toggle>
          <div class="flex-1"></div>
          <button @click="removeCommand(command)" class="mr-2 text-gray-500">{{ t('Remove') }}</button>
          <hotkey-input v-model="command.hotkey" class="w-48" />
        </div>
      </div>
      <button @click="addComand" class="bg-gray-900 rounded flex items-baseline px-2 py-1 leading-none"><i class="fas fa-plus mr-1"></i> {{ t('Add command') }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HotkeyInput from './HotkeyInput.vue'
import { Config } from '@/web/Config'
import { Config as IConfig } from '@/ipc/types'

export default defineComponent({
  components: { HotkeyInput },
  setup () {
    const { t } = useI18n()

    return {
      t,
      commands: computed(() => Config.store.commands),
      addComand () {
        Config.store.commands.push({
          text: '',
          hotkey: null,
          send: true
        })
      },
      removeCommand (command: IConfig['commands'][number]) {
        Config.store.commands = Config.store.commands.filter(c => c !== command)
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Add command": "Добавить команду",
    "press Enter": "нажимать Enter"
  }
}
</i18n>
