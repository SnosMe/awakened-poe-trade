<template>
  <widget :config="config" move-handles="center" v-slot="{ isMoving }" readonly :hideable="false">
    <div :class="$style.wrapper">
      <div :class="$style.timer">
        <span>{{ formatted.h }}:{{ formatted.m }}:</span><span>{{ formatted.s }}</span>
      </div>
      <div v-if="!isMoving" :class="$style.controls" class="absolute top-0 left-0 w-full flex justify-center">
        <button v-if="!isRunning" @click="start" :class="$style.button"><i class="fas fa-play"></i></button>
        <button v-else @click="stop" :class="$style.button"><i class="fas fa-pause"></i></button>
        <button @click="restart" :class="$style.button"><i class="fas fa-redo"></i></button>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, ref, onUnmounted, computed } from 'vue'
import Widget from './Widget.vue'
import { Duration } from 'luxon'
import { WidgetManager, StopwatchWidget } from './interfaces'

export default defineComponent({
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<StopwatchWidget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    if (props.config.wmFlags[0] === 'uninitialized') {
      props.config.wmFlags = []
      props.config.anchor = {
        pos: 'cc',
        x: 50,
        y: 50
      }
      wm.show(props.config.wmId)
    }

    const isRunning = ref(false)
    const millis = ref(0)
    const prevTick = ref(0)

    const timerId = setInterval(updateTime, 1000)
    onUnmounted(() => {
      clearInterval(timerId)
    })

    const formatted = computed(() => {
      const dur = Duration.fromMillis(millis.value).shiftTo('hours', 'minutes', 'seconds')

      return {
        h: String(dur.hours).padStart(2, '0'),
        m: String(dur.minutes).padStart(2, '0'),
        s: String(Math.floor(dur.seconds)).padStart(2, '0')
      }
    })

    function start () {
      isRunning.value = true
      prevTick.value = Date.now()
    }
    function stop () {
      updateTime()
      isRunning.value = false
    }
    function restart () {
      prevTick.value = Date.now()
      millis.value = 0
    }
    function updateTime () {
      if (isRunning.value) {
        const now = Date.now()
        millis.value += now - prevTick.value
        prevTick.value = now
      }
    }

    return {
      formatted,
      isRunning,
      start,
      stop,
      restart
    }
  }
})
</script>

<style lang="postcss" module>
.timer {
  font-size: 2rem;
  font-family: Consolas;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 3px rgb(0, 0, 0);
}

.button {
  background: rgba(29, 29, 29, 0.863);
  @apply rounded;
  line-height: 1;
  color: #fff;
  width: 2rem;
  height: 2rem;
  @apply mx-1;
}

.wrapper {
  &:not(:hover) {
    .controls {
      display: none;
    }
  }
}
</style>
