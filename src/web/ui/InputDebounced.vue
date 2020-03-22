<template>
  <input
    :value="value"
    @input="update"
    @focus="$emit('focus', $event)">
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
  }
}
</script>
