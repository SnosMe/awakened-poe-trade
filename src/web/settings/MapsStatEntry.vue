<template>
  <div class="flex py-1 w-full" :class="$style.row">
    <div class="flex-1 truncate px-2">{{ matcher }}</div>
    <div class="flex" :class="{ [$style.controlsAutoHide]: !removable }">
      <ui-radio v-model="decision" value="warning" class="pl-1 w-7 mx-2"></ui-radio>
      <ui-radio v-model="decision" value="danger" class="pl-1 w-7 mx-2"></ui-radio>
      <ui-radio v-model="decision" value="desirable" class="pl-1 w-7 mx-2"></ui-radio>
      <div class="flex w-6">
        <button v-if="removable"
          @click="remove"
          class="mx-1 leading-none flex items-center"><i class="fas fa-times w-4"></i></button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { Config } from '@/web/Config'
import { ItemCheckWidget } from '../overlay/interfaces'

export default defineComponent({
  emits: [],
  props: {
    matcher: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const config = computed(() => {
      return Config.store.widgets.find(widget => widget.wmType === 'item-check') as ItemCheckWidget
    })
    const entry = computed(() => {
      return config.value.maps.selectedStats.find(_ => _.matcher === props.matcher)
    })

    const decision = computed<undefined | string>({
      get () {
        return entry.value?.decision
      },
      set (value) {
        if (entry.value) {
          entry.value.decision = value!
        } else {
          config.value.maps.selectedStats.push({
            matcher: props.matcher,
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
      entry,
      decision,
      removable,
      remove
    }
  }
})
</script>

<style lang="postcss" module>
.row:hover {
  @apply bg-gray-700;
}

.controlsAutoHide {
  display: none;
}

.row:hover .controlsAutoHide {
  display: flex;
}
</style>
