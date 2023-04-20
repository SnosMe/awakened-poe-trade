<template>
  <widget :config="config" move-handles="center" v-slot="{ isMoving }" :inline-edit="false" :hideable="false">
    <div :class="$style.wrapper">
      <div :class="$style.timer">
        <span>{{ formatted.h }}:{{ formatted.m }}:</span><span>{{ formatted.s }}</span>
      </div>
      <div v-if="!isRunning" :class="$style.paused">{{ t('stopwatch.paused') }}</div>
      <div v-if="!isMoving" :class="$style.controls">
        <button v-if="!isRunning" @click="start" :class="$style.button"><i class="fas fa-play"></i></button>
        <button v-else @click="stop" :class="$style.button"><i class="fas fa-pause"></i></button>
        <button @click="reset" :class="$style.button"><i class="fas fa-redo"></i></button>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, inject, ref, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Widget from './Widget.vue'
import { MainProcess } from '@/web/background/IPC'
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
      props.config.anchor = {
        pos: 'cc',
        x: (Math.random() * (60 - 40) + 40),
        y: (Math.random() * (60 - 40) + 40)
      }
      props.config.toggleKey = null
      props.config.resetKey = null
      wm.show(props.config.wmId)
    }
    props.config.wmFlags = ['invisible-on-blur']

    const hotkeyController = MainProcess.onEvent('MAIN->CLIENT::widget-action', (e) => {
      if (e.target === `stopwatch-start-stop:${props.config.wmId}`) {
        isRunning.value ? stop() : start()
      } else if (e.target === `stopwatch-reset:${props.config.wmId}`) {
        reset()
      }
    })
    onUnmounted(() => {
      hotkeyController.abort()
    })

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
      wm.setFlag(props.config.wmId, 'invisible-on-blur', false)
    }
    function stop () {
      updateTime()
      isRunning.value = false
      if (millis.value < 1000) {
        wm.setFlag(props.config.wmId, 'invisible-on-blur', true)
      }
    }
    function reset () {
      prevTick.value = Date.now()
      millis.value = (isRunning.value) ? 1000 : 0
      if (!isRunning.value) {
        wm.setFlag(props.config.wmId, 'invisible-on-blur', true)
      }
    }
    function updateTime () {
      if (isRunning.value) {
        const now = Date.now()
        millis.value += now - prevTick.value
        prevTick.value = now
      }
    }

    const { t } = useI18n()

    return {
      t,
      formatted,
      isRunning,
      start,
      stop,
      reset
    }
  }
})
</script>

<style lang="postcss" module>
.timer {
  font-size: 2rem;
  line-height: 1;
  @apply font-mono;
  text-shadow: 0 1px 3px rgb(0, 0, 0);
}

.button {
  background: rgba(29, 29, 29, 0.863);
  @apply rounded;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  @apply mx-1;
}

.controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wrapper {
  @apply px-2 py-1;
  @apply rounded text-white;
  @apply bg-gray-300/30;

  &:not(:hover) {
    .controls {
      display: none;
    }
  }
}

.paused {
  position: absolute;
  top: 0;
  right: 0;
  line-height: 1;
  @apply px-2 rounded shadow;
  @apply bg-orange-700 text-white;
}
</style>
