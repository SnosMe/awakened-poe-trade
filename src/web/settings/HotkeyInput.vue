<template>
  <input
    @keyup="handleKeyup"
    @keydown.prevent
    :placeholder="modelValue || $t('Not Set')"
    :class="{ 'placeholder-red-500': !modelValue }"
    class="rounded bg-gray-900 px-1 text-center font-fontin-regular" />
</template>

<script lang="ts">
import { PropType } from 'vue'
import { KeyToCode, forbidden } from '@/ipc/KeyToCode'

export default {
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: String,
      default: undefined
    },
    forbidden: {
      type: Array,
      default: () => forbidden
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  setup (props, ctx) {
    return {
      handleKeyup (e: KeyboardEvent) {
        e.preventDefault()
        e.stopPropagation()
  
        if (e.code === 'Backspace') {
          if (!props.required) {
            ctx.emit('update:modelValue', null)
          }
          return
        }
  
        let { code, ctrlKey, shiftKey, altKey } = e
  
        if (code.startsWith('Key')) {
          code = code.substr('Key'.length)
        } else if (code.startsWith('Digit')) {
          code = code.substr('Digit'.length)
        } else if (e.key === 'Cancel' && code === 'Pause') {
          code = 'Cancel'
        }
  
        if (
          (KeyToCode as Record<string, number>)[code] &&
          (ctrlKey ? !props.forbidden.includes('Ctrl') : true) &&
          (shiftKey ? !props.forbidden.includes('Shift') : true) &&
          (altKey ? !props.forbidden.includes('Alt') : true)
        ) {
          if (shiftKey && altKey) code = `Shift + Alt + ${code}`
          else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`
          else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`
          else if (altKey) code = `Alt + ${code}`
          else if (ctrlKey) code = `Ctrl + ${code}`
          else if (shiftKey) code = `Shift + ${code}`
  
          if (!props.forbidden.includes(code)) {
            ctx.emit('update:modelValue', code)
          }
        }
      }
    }
  }
}
</script>

<i18n>
{
  "ru": {
    "Not Set": "Не назначено"
  }
}
</i18n>
