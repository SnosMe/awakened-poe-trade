<template>
  <button
    @click="updateInput"
    class="ui-radio">
    <i v-if="!isChecked" class="far fa-circle mr-1"></i>
    <i v-else class="fas fa-check-circle mr-1"></i>
    <slot />
  </button>
</template>

<script>
export default {
  name: 'UiRadio',
  model: {
    prop: 'modelValue'
  },
  props: {
    value: {
      type: [Boolean, String, Number, Object],
      required: true
    },
    modelValue: {
      type: [Boolean, String, Number, Object],
      required: true
    }
  },
  computed: {
    isChecked () {
      return this.modelValue === this.value
    }
  },
  methods: {
    updateInput () {
      this.$emit('input', this.value)
    }
  }
}
</script>
