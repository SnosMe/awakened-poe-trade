<template>
  <div class="absolute rounded-full" :style="{
      top: relativePos.top,
      left: relativePos.left,
      width: '5rem',
      height: '5rem',
      background: 'rgba(255,255,255,0.35)'
    }" style="box-shadow: 0 1px 3px 0 rgb(0, 0, 0), 0 1px 2px 0 rgb(0, 0, 0);">
    <div class="relative rounded-full" :style="{
      top: `1.875rem`,
      left: `1.875rem`,
      width: '1.25rem',
      height: '1.25rem',
      background: 'rgba(255,255,255,0.5)'
    }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  position: { x: number, y: number }
}>()

const relativePos = computed(() => {
  return {
    top: `calc(${props.position.y - window.screenY}px - 2.5rem)`,
    left: `calc(${props.position.x - window.screenX}px - 2.5rem)`
  }
})
</script>
