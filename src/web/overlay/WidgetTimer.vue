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

<script>
import Widget from './Widget'
import { Duration } from 'luxon'

export default {
  components: { Widget },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  inject: ['wm'],
  data () {
    if (this.config.wmFlags[0] === 'uninitialized') {
      this.config.wmFlags = []
      this.$set(this.config, 'anchor', {
        pos: 'cc',
        x: 50,
        y: 50
      })
      this.wm.show(this.config.wmId)
    }

    return {
      isRunning: false,
      millis: 0,
      prevTick: 0
    }
  },
  created () {
    this.timerId_ = setInterval(this.updateTime, 1000)
  },
  destroyed () {
    clearInterval(this.timerId_)
  },
  computed: {
    formatted () {
      const dur = Duration.fromMillis(this.millis).shiftTo('hours', 'minutes', 'seconds')

      return {
        h: String(dur.hours).padStart(2, '0'),
        m: String(dur.minutes).padStart(2, '0'),
        s: String(Math.floor(dur.seconds)).padStart(2, '0')
      }
    }
  },
  methods: {
    start () {
      this.isRunning = true
      this.prevTick = Date.now()
    },
    stop () {
      this.updateTime()
      this.isRunning = false
    },
    restart () {
      this.prevTick = Date.now()
      this.millis = 0
    },
    updateTime () {
      if (this.isRunning) {
        const now = Date.now()
        this.millis += now - this.prevTick
        this.prevTick = now
      }
    }
  }
}
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
