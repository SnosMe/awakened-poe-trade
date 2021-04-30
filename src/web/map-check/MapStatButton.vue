<template>
  <div class="flex">
    <button @click="handleClick"
      class="px-2 leading-none py-2 m-0 text-left flex-1 flex items-center overflow-hidden"
      :class="decision === 'danger' ? 'bg-red-700'
            : decision === 'warning' ? 'bg-orange-600'
            : decision === 'desirable' ? 'bg-green-700'
            : 'hover:bg-gray-700'">
      <template v-if="true">
        <i v-if="!decision || decision === 'seen'"
          class="inline-block mr-2" style="min-width: 1rem;">{{ '\u2009' }}</i>
        <i v-else
          class="fas mr-2 text-center" style="min-width: 1rem;"
          :class="decision === 'danger' ? 'fa-skull-crossbones'
            : decision === 'warning' ? 'fa-exclamation-triangle'
            : 'fa-check'"></i>
      </template>
      <item-modifier-text :text="stat.matcher" :roll="stat.roll" class="truncate" />
    </button>
    <button @click="toggleSeenStatus" class="flex leading-none items-center text-gray-600 w-8 text-center justify-center">
      <i v-if="showNewStatIcon" class="fas fa-eye-slash"></i>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import ItemModifierText from '../ui/ItemModifierText.vue'
import { Config } from '@/web/Config'
import { PreparedStat } from './prepare-map-stats'
import { ItemCheckWidget } from '../overlay/interfaces'

export default defineComponent({
  components: { ItemModifierText },
  props: {
    stat: {
      type: Object as PropType<PreparedStat>,
      required: true
    }
  },
  setup (props) {
    const config = computed(() => {
      return Config.store.widgets.find(widget => widget.wmType === 'item-check') as ItemCheckWidget
    })
    const entry = computed(() => {
      return config.value.maps.selectedStats.find(_ => _.matcher === props.stat.matcher)
    })

    const showNewStatIcon = computed(() => {
      return config.value.maps.showNewStats && !entry.value
    })

    function toggleSeenStatus () {
      if (!config.value.maps.showNewStats) return

      if (!entry.value) {
        config.value.maps.selectedStats.push({
          matcher: props.stat.matcher,
          decision: 'seen'
        })
      } else if (entry.value.decision === 'seen') {
        config.value.maps.selectedStats = config.value.maps.selectedStats.filter(selected => selected !== entry.value)
      }
    }

    return {
      decision: computed(() => entry.value?.decision),
      showNewStatIcon,
      toggleSeenStatus,
      handleClick () {
        if (!entry.value) {
          config.value.maps.selectedStats.push({
            matcher: props.stat.matcher,
            decision: 'danger'
          })
        } else {
          if (entry.value.decision === 'danger') {
            entry.value.decision = 'warning'
          } else if (entry.value.decision === 'warning') {
            entry.value.decision = 'desirable'
          } else if (entry.value.decision === 'desirable') {
            entry.value.decision = 'seen'
          } else if (entry.value.decision === 'seen') {
            entry.value.decision = 'danger'
          }
        }
      }
    }
  }
})
</script>
