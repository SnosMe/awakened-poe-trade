<template>
  <span>
    <span v-for="(part, idx) of parts" :key="idx"
      :class="{
        'text-white font-exo2 font-semibold': part.placeholder,
        'text-gray-200': !part.placeholder
      }"
      >{{ part.text }}</span>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true
    },
    roll: {
      type: Number,
      default: undefined
    }
  },
  setup (props) {
    return {
      parts: computed(() => {
        const res = [] as Array<{ text: string, placeholder?: boolean }>
        props.text.split(/(?<![#])[+-]?[#]/gm).forEach((text, idx, parts) => {
          if (text !== '') {
            res.push({ text })
          }
          if (idx !== (parts.length - 1)) {
            if (props.roll == null) {
              res.push({ text: '#' })
            } else {
              res.push({
                text: String(props.roll),
                placeholder: true
              })
            }
          }
        })

        return res
      })
    }
  }
})
</script>
