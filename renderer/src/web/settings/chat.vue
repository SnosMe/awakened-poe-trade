<template>
  <div class="max-w-md p-2">
    <div class="flex flex-col gap-y-4 mb-4">
      <div class="flex flex-col gap-y-1" v-for="(command, idx) in commands" :key="idx">
        <input v-model.trim="command.text" class="rounded bg-gray-900 px-1 block w-full font-poe" />
        <div class="flex gap-x-2">
          <ui-toggle v-model="command.send" class="ml-1">{{ t('press Enter') }}</ui-toggle>
          <button @click="removeCommand(idx)" class="ml-auto text-gray-500">{{ t('Remove') }}</button>
          <hotkey-input v-model="command.hotkey" class="w-48" />
        </div>
      </div>
    </div>
    <button @click="addComand" class="bg-gray-900 rounded flex items-baseline px-2 py-1 leading-none"><i class="fas fa-plus mr-1"></i> {{ t('Add command') }}</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { configProp } from './utils'
import HotkeyInput from './HotkeyInput.vue'

export default defineComponent({
  name: 'Chat',
  components: { HotkeyInput },
  props: configProp(),
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      commands: computed(() => props.config.commands),
      addComand () {
        props.config.commands.push({
          text: '',
          hotkey: null,
          send: true
        })
      },
      removeCommand (idx: number) {
        props.config.commands.splice(idx, 1)
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
  },
  "zh_CN": {
    "Add command": "增加命令",
    "press Enter": "按回车(Enter)"
  },
  "cmn-Hant": {
    "Add command": "增加命令",
    "press Enter": "按回車(Enter)"
  }
}
</i18n>
