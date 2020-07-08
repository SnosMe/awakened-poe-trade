<template>
  <div @mousedown="handleMouseDown">
    <div :class="$style.widget" :style="widgetPosition">
      <div :class="{ 'opacity-75': isMoving }">
        <slot :isEditing="isEditing" :isMoving="isMoving" />
      </div>
      <div class="absolute px-1" :style="actionsPosition">
        <div :class="$style.actionsPanel">
          <button v-if="hideable" @click="hide"
            :class="$style.action">{{ $t('hide') }}</button>
          <button v-if="!readonly" @click="toggleEdit"
            :class="[$style.action, { [$style.active]: isEditing }]">{{ $t('edit') }}</button>
          <button v-if="moveHandles !== 'none'" @click="toggleMove"
            :class="[$style.action, { [$style.active]: isMoving }]">{{ $t('move') }}</button>
          <button v-if="removable" @mousedown="startRemoveTimer" @mouseup="cancelRemoveTimer" @mouseleave="cancelRemoveTimer"
            :class="[$style.action, $style.removable, { [$style.removing]: isRemoving }]">{{ $t('delete') }}</button>
        </div>
      </div>
      <div v-if="isMoving">
        <div v-if="isHandleShown('tl')" :class="$style.mover" @mousedown="startMove('tl', $event)" style="left: -0.5rem; top: -0.5rem;"></div>
        <div v-if="isHandleShown('tc')" :class="$style.mover" @mousedown="startMove('tc', $event)" style="left: calc(50%  - 0.5rem); top: -0.5rem;"></div>
        <div v-if="isHandleShown('tr')" :class="$style.mover" @mousedown="startMove('tr', $event)" style="left: calc(100% - 0.5rem); top: -0.5rem;"></div>
        <div v-if="isHandleShown('cr')" :class="$style.mover" @mousedown="startMove('cr', $event)" style="left: calc(100% - 0.5rem); top: calc(50% - 0.5rem);"></div>
        <div v-if="isHandleShown('br')" :class="$style.mover" @mousedown="startMove('br', $event)" style="left: calc(100% - 0.5rem); top: calc(100% - 0.5rem);"></div>
        <div v-if="isHandleShown('bc')" :class="$style.mover" @mousedown="startMove('bc', $event)" style="left: calc(50%  - 0.5rem); top: calc(100% - 0.5rem);"></div>
        <div v-if="isHandleShown('bl')" :class="$style.mover" @mousedown="startMove('bl', $event)" style="left: -0.5rem; top: calc(100% - 0.5rem);"></div>
        <div v-if="isHandleShown('cl')" :class="$style.mover" @mousedown="startMove('cl', $event)" style="left: -0.5rem; top: calc(50%  - 0.5rem);"></div>
        <div v-if="isHandleShown('cc')" :class="$style.mover" @mousedown="startMove('cc', $event)" style="left: calc(50%  - 0.5rem); top: calc(50%  - 0.5rem);"></div>
      </div>
    </div>
    <div v-if="isMoving" :class="[$style.mover, $style.active]" :style="moverPosition" @mousedown="startMove(anchor.pos, $event)"></div>
  </div>
</template>

<script>
export default {
  props: {
    config: {
      type: Object,
      required: true
    },
    moveHandles: {
      type: [String, Array],
      default: undefined
    },
    readonly: {
      type: Boolean,
      default: false
    },
    removable: {
      type: Boolean,
      default: true
    },
    hideable: {
      type: Boolean,
      default: true
    }
  },
  inject: ['wm'],
  data () {
    return {
      isEditing: false,
      isMoving: false,
      isRemoving: false
    }
  },
  computed: {
    anchor () {
      return this.config.anchor
    },
    moverPosition () {
      return {
        'top': `max(0%, min(calc(${this.anchor.y}% - (1rem/2)), calc(100% - 1rem)))`,
        'left': `max(0%, min(calc(${this.anchor.x}% - (1rem/2)), calc(100% - 1rem)))`,
        'z-index': this.config.wmZorder
      }
    },
    widgetPosition () {
      let translate

      // <top, center, bottom><left, center, right>
      if (this.anchor.pos === 'tl') {
        translate = undefined
      } else if (this.anchor.pos === 'tc') {
        translate = 'translate(-50%, 0%)'
      } else if (this.anchor.pos === 'tr') {
        translate = 'translate(-100%, 0%)'
      } else if (this.anchor.pos === 'cr') {
        translate = 'translate(-100%, -50%)'
      } else if (this.anchor.pos === 'br') {
        translate = 'translate(-100%, -100%)'
      } else if (this.anchor.pos === 'bc') {
        translate = 'translate(-50%, -100%)'
      } else if (this.anchor.pos === 'bl') {
        translate = 'translate(0%, -100%)'
      } else if (this.anchor.pos === 'cl') {
        translate = 'translate(0%, -50%)'
      } else if (this.anchor.pos === 'cc') {
        translate = 'translate(-50%, -50%)'
      }

      return {
        'top': `${this.anchor.y}%`,
        'left': `${this.anchor.x}%`,
        'transform': translate,
        'z-index': this.config.wmZorder
      }
    },
    actionsPosition () {
      if (this.anchor.x <= 50 && this.anchor.y <= 50) {
        return {
          top: '0',
          left: '100%'
        }
      }
      if (this.anchor.x >= 50 && this.anchor.y <= 50) {
        return {
          top: '0',
          right: '100%'
        }
      }
      if (this.anchor.x >= 50 && this.anchor.y >= 50) {
        return {
          bottom: '0',
          right: '100%'
        }
      }
      if (this.anchor.x <= 50 && this.anchor.y >= 50) {
        return {
          bottom: '0',
          left: '100%'
        }
      }
      return null
    },
    shownHandles () {
      if (!this.moveHandles) {
        return ['tl', 'tc', 'tr', 'cr', 'br', 'bc', 'bl', 'cl', 'cc']
      }
      if (this.moveHandles === 'center') {
        return ['cc']
      }
      if (this.moveHandles === 'corners') {
        return ['tl', 'tr', 'br', 'bl']
      }
      return []
    }
  },
  methods: {
    startMove (pos, e) {
      this.anchor.pos = pos
      this.updatePosition(e)
      document.addEventListener('mousemove', this.updatePosition)
      document.addEventListener('mouseup', this.endMove)
    },
    endMove () {
      document.removeEventListener('mousemove', this.updatePosition)
      document.removeEventListener('mouseup', this.endMove)
    },
    updatePosition (e) {
      this.anchor.x = Math.min(Math.max(e.clientX / window.innerWidth, 0), 1) * 100
      this.anchor.y = Math.min(Math.max(e.clientY / window.innerHeight, 0), 1) * 100
    },
    isHandleShown (pos) {
      return this.anchor.pos !== pos &&
        this.shownHandles.includes(pos)
    },
    toggleEdit () {
      this.isEditing = !this.isEditing
      this.isMoving = false
    },
    toggleMove () {
      this.isMoving = !this.isMoving
      this.isEditing = false
    },
    hide () {
      this.wm.hide(this.config.wmId)
    },
    remove () {
      this.wm.remove(this.config.wmId)
    },
    startRemoveTimer () {
      this.isRemoving = true
      this.removeTimeout = setTimeout(this.remove, 1000)
    },
    cancelRemoveTimer () {
      this.isRemoving = false
      clearTimeout(this.removeTimeout)
      this.removeTimeout = undefined
    },
    handleMouseDown () {
      if (this.config.wmId != null) {
        this.wm.bringToTop(this.config.wmId)
      }
    }
  }
}
</script>

<style lang="postcss" module>
.widget {
  position: absolute;

  &:not(:hover) {
    .actionsPanel {
      display: none;
    }
  }
}

.actionsPanel {
  @apply py-1;
  color: #fff;
  background: rgba(0,0,0, 0.25);
  display: flex;
  flex-direction: column;
  @apply rounded;
}

.action {
  @apply px-1;
  text-align: left;

  &:hover {
    background: rgba(255,255,255, 0.1);
  }

  &.active {
    background: rgba(0,0,0, 0.5);
  }

  &.removable {
    background: linear-gradient(to left, transparent 50%, theme('colors.red.600') 50%);
    background-size: 250% 100%;
    background-position: right bottom;
  }

  &.removing {
    background-size: 200% 100%;
    transition: background-position 1s ease-out;
    background-position: left bottom;
  }
}

.mover {
  position: absolute;
  /* top: max(0%, min(calc(y% - (1rem/2)), calc(100% - 1rem))); */
  /* left: max(0%, min(calc(x% - (1rem/2)), calc(100% - 1rem))); */
  width: 1rem;
  height: 1rem;
  border: 0.25rem solid rgba(0, 0, 0, 0.5);
  cursor: move;
  user-select: none;

  &.active {
    position: fixed;
    border-color: #fff;
    box-shadow: 0 1px 3px 0 rgb(0, 0, 0),
                0 1px 2px 0 rgb(0, 0, 0);
  }
}
</style>

<style lang="postcss">
.widget-default-style {
  @apply rounded;
  @apply bg-gray-900;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.75),
              0 1px 2px 0 rgba(0, 0, 0, 0.75);
}
</style>

<i18n>
{
  "ru": {
    "hide": "скрыть",
    "edit": "редактировать",
    "move": "переместить",
    "delete": "удалить"
  }
}
</i18n>
