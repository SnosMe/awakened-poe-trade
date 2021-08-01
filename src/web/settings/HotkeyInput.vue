<template>
  <input
    @keyup="handleKeyup"
    @keydown.prevent
    :placeholder="modelValue || t('Not Set')"
    :class="{ 'placeholder-red-400': !modelValue }"
    class="rounded bg-gray-900 px-1 text-center font-fontin-regular" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyToCode, forbidden, hotkeyToString } from '@/ipc/KeyToCode'

export default defineComponent({
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
          code = hotkeyToString([code], ctrlKey, shiftKey, altKey)

          if (!props.forbidden.includes(code)) {
            ctx.emit('update:modelValue', code)
          }
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
  }
}
</i18n>
