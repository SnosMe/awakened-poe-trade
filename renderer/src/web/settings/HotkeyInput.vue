<template>
  <input
    @keyup="handleKeyup"
    @keydown.prevent
    :placeholder="modelValue || t('Not Set')"
    :class="{ 'placeholder-red-400': !modelValue }"
    class="rounded bg-gray-900 px-1 text-center font-poe" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyToCode, hotkeyToString } from '@ipc/KeyToCode'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: String as PropType<string | null>,
      default: null
    },
    noModKeys: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  setup (props, ctx) {
    const { t } = useI18n()

    return {
      t,
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
          code = code.slice('Key'.length)
        } else if (code.startsWith('Digit')) {
          code = code.slice('Digit'.length)
        } else if (e.key === 'Cancel' && code === 'Pause') {
          code = 'Cancel'
        }

        if ((KeyToCode as Record<string, number>)[code]) {
          code = hotkeyToString([code], ctrlKey, shiftKey, altKey)
          if (code.includes('F12')) return
          if (props.noModKeys && code.includes('+')) return
          ctx.emit('update:modelValue', code)
        }
      }
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Not Set": "Не назначено"
  },
  "zh_CN": {
    "Not Set": "未设置"
  },
  "cmn-Hant": {
    "Not Set": "未設置"
  }
}
</i18n>
