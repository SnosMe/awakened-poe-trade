<template>
  <div class="w-full h-full"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false">
    <img :class="$style.img" :src="isBundled ? require(`@/assets/images/${src}`) : src">
    <portal v-if="isHovered && !disabled" mount-to="body" append>
      <div :class="$style.imgFullscreenWrapper">
        <img :class="$style.imgFullscreen" :src="isBundled ? require(`@/assets/images/${src}`) : src">
      </div>
    </portal>
  </div>
</template>

<script>
import { MountingPortal as Portal } from 'portal-vue'

export default {
  components: { Portal },
  name: 'FullscreenImage',
  props: {
    src: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isHovered: false
    }
  },
  computed: {
    isBundled () {
      return !this.src.includes('://')
    }
  }
}
</script>

<style lang="postcss" module>
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.imgFullscreenWrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  pointer-events: none;
  z-index: 2147483647;
}

.imgFullscreen {
  max-height: 100%;
  border: 0.25rem solid theme('colors.gray.900');
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.75),
              0 1px 2px 0 rgba(0, 0, 0, 0.75);
}
</style>
