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
    filter: {
      type: Object,
      required: true
    }
  },
  computed: {
    parts () {
      const res = []
      this.filter.text.split(/(?<![#])[+-]?[#]/gm).forEach((text, idx, parts) => {
        if (text !== '') {
          res.push({ text })
        }
        if (idx !== (parts.length - 1)) {
          if (this.filter.roll == null) {
            res.push({ text: '#' })
          } else {
            res.push({
              text: this.filter.roll,
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
