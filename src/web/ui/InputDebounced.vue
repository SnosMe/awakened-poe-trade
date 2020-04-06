<template>
  <input
    :value="value"
    @input="update"
    @mousewheel="noop">
</template>

<script>
import { debounce } from 'throttle-debounce'

export default {
  name: 'UiInputDebounced',
  props: {
    value: {},
    delay: {
      type: Number,
      default: 350
    }
  },
  created () {
    this.update = debounce(this.delay, (e) => {
      this.$emit('input', e.target.value)
    })
  },
  methods: {
    noop () {
      // fix not working mouseScroll
    }
  }
}
</script>
