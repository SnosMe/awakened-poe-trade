<template>
  <div>
    <div v-for="modifier in item.modifiers" :key="`${modifier.mod.text}${modifier.type}`"
      class="py-2 border-b border-gray-700">
      <div class="pb-1 flex items-baseline">
        <i class="fas fa-check-square w-5"></i>
        <span class="">{{ modifier.mod.text }}</span>
      </div>
      <div class="flex">
        <div class="w-5"></div>
        <div class="text-xs leading-none px-1 rounded" :class="`mod-type-${modifier.type}`">{{ modifier.type }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  }
}
</script>

<style lang="postcss">
.mod-type-implicit {
  @apply bg-yellow-700 text-yellow-100
}

.mod-type-crafted {
  @apply bg-blue-600 text-blue-100
}

.mod-type-explicit {
  @apply -mx-1 text-gray-600
}

.mod-type-enchant {
  @apply bg-purple-600 text-purple-100
}
</style>
