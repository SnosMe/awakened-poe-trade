<template>
  <div class="absolute rounded-full" :style="{
      top: `${position.y - 40}px`,
      left: `${position.x - 40}px`,
      width: '80px',
      height: '80px',
      background: 'rgba(255,255,255,0.35)'
    }" style="box-shadow: 0 1px 3px 0 rgb(0, 0, 0), 0 1px 2px 0 rgb(0, 0, 0);">
    <div class="relative rounded-full" :style="{
      top: `30px`,
      left: `30px`,
      width: '20px',
      height: '20px',
      background: 'rgba(255,255,255,0.5)'
    }"></div>
  </div>
</template>

<script>
export default {
  props: {
    position: {
      type: Object,
      required: true
    }
  }
}
</script>
