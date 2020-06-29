<template>
  <button
    @click="updateInput" class="flex items-center" style="height: 1.375rem;">
    <i v-if="value" class="fas fa-toggle-on pr-1 text-gray-300"></i>
    <i v-else class="fas fa-toggle-off pr-1 text-gray-600"></i>
    <slot />
  </button>
</template>

<script>
export default {
  name: 'UiToggle',
  props: {
    value: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    updateInput () {
      this.$emit('input', !this.value)
    }
  }
}
</script>
