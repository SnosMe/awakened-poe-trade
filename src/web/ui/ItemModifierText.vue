<template>
  <span>
    <span v-for="(part, idx) of parts" :key="idx"
      :class="{
        'text-gray-100 font-sans font-semibold text-xs': part.placeholder,
        'text-gray-300': !part.placeholder
      }"
      >{{ part.text }}</span>
  </span>
</template>

<script>
export default {
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
  computed: {
    parts () {
      const res = []
      this.text.split(/(?<![#])[+-]?[#]/gm).forEach((text, idx, parts) => {
        if (text !== '') {
          res.push({ text })
        }
        if (idx !== (parts.length - 1)) {
          if (this.roll == null) {
            res.push({ text: '#' })
          } else {
            res.push({
              text: this.roll,
              placeholder: true
            })
          }
        }
      })

      return res
    }
  }
}
</script>
