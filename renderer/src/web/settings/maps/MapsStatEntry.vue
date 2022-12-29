<template>
  <div :class="$style['row']" >
    <div class="flex-1 flex items-center px-2 overflow-hidden gap-x-1 whitespace-nowrap">
      <span v-if="matcher.outdated" :class="[$style['tag'], $style['tag-outdated']]">{{ t('map.mods.outdated') }}</span>
      <span v-if="matcher.heist" :class="[$style['tag'], $style['tag-heist']]">{{ t('map.mods.heist') }}</span>
      <span class="truncate">{{ matcher.str }}</span>
    </div>
    <div class="flex items-baseline gap-x-4" :class="{ [$style['controls-auto-hide']]: !removable }">
      <ui-radio v-model="decision" value="warning" class="p-1" />
      <ui-radio v-model="decision" value="danger" class="p-1" />
      <ui-radio v-model="decision" value="desirable" class="p-1" />
      <button v-if="removable" @click="remove"
        class="flex items-center mx-1 py-1" :class="{ 'text-red-400': matcher.outdated }">
        <i class="w-4" :class="matcher.outdated ? 'fas fa-trash-alt' : 'fas fa-times'"></i>
      </button>
      <div v-else class="w-6" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ItemCheckWidget } from '@/web/overlay/interfaces'
import type { MapStatMatcher } from './interfaces'

export default defineComponent({
  emits: [],
  props: {
    matcher: {
      type: Object as PropType<MapStatMatcher>,
      required: true
    },
    selectedStats: {
      type: Array as PropType<ItemCheckWidget['maps']['selectedStats']>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    const entry = computed(() => {
      return props.selectedStats.find(entry => entry.matcher === props.matcher.str)
    })

    const decision = computed<undefined | string>({
      get () {
        return entry.value?.decision
      },
      set (value) {
        if (entry.value) {
          entry.value.decision = value!
        } else {
          props.selectedStats.push({
            matcher: props.matcher.str,
            decision: value!
          })
        }
      }
    })

    function remove () {
      if (entry.value) {
        decision.value = 'seen'
      }
    }

    const removable = computed(() => {
      return entry.value && decision.value !== 'seen'
    })

    return {
      t,
      entry,
      decision,
      removable,
      remove
    }
  }
})
</script>

<style lang="postcss" module>
.row {
  display: flex;
  align-items: center;
  width: 100%;
  @apply h-8;
  cursor: default;
  line-height: 1;
}

.row:hover {
  @apply bg-gray-700;
}

.row:not(:hover) .controls-auto-hide {
  display: none !important;
}

.tag {
  @apply px-1;
  @apply rounded;
  line-height: 1;
}
.tag-heist {
  @apply bg-red-800;
}
.tag-outdated {
  @apply bg-red-400 text-black;
}
</style>
