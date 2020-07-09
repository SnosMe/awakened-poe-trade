<template>
  <input
    @keyup="handleKeyup"
    @keydown.prevent
    :placeholder="value || $t('Not Set')"
    :class="{ 'placeholder-red-500': !value }"
    class="rounded bg-gray-900 px-1 text-center font-fontin-regular" />
</template>

<script>
import { KeyToCode } from '@/ipc/KeyToCode'

export default {
  props: {
    value: {
      type: String
    },
    forbidden: {
      type: Array,
      default: () => ['Ctrl + C', 'Ctrl + V', 'Ctrl + A', 'Ctrl + F']
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleKeyup (e) {
      e.preventDefault()
      e.stopPropagation()

      if (e.code === 'Backspace') {
        if (!this.required) {
          this.$emit('input', null)
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
        KeyToCode[code] &&
        (ctrlKey ? !this.forbidden.includes('Ctrl') : true) &&
        (shiftKey ? !this.forbidden.includes('Shift') : true) &&
        (altKey ? !this.forbidden.includes('Alt') : true)
      ) {
        if (shiftKey && altKey) code = `Shift + Alt + ${code}`
        else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`
        else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`
        else if (altKey) code = `Alt + ${code}`
        else if (ctrlKey) code = `Ctrl + ${code}`
        else if (shiftKey) code = `Shift + ${code}`

        if (!this.forbidden.includes(code)) {
          this.$emit('input', code)
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
