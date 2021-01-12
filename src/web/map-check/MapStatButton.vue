<template>
  <div class="flex">
    <button @click="handleClick"
      class="px-2 leading-none py-2 m-0 text-left flex-1 flex items-center overflow-hidden"
      :class="state === 'danger' ? 'bg-red-700'
            : state === 'warning' ? 'bg-orange-600'
            : state === 'desirable' ? 'bg-green-700'
            : 'hover:bg-gray-700'">
      <template>
        <i v-if="!state || state === 'not-matched'"
          class="inline-block mr-2" style="min-width: 1rem;">{{ '\u2009' }}</i>
        <i v-else
          class="fas mr-2 text-center" style="min-width: 1rem;"
          :class="state === 'danger' ? 'fa-skull-crossbones'
            : state === 'warning' ? 'fa-exclamation-triangle'
            : 'fa-check'"></i>
      </template>
      <item-modifier-text :text="stat.matcher" :roll="stat.roll" class="truncate" />
    </button>
    <div class="flex leading-none items-center text-gray-600 w-8 text-center justify-center">
      <i v-if="state === 'not-matched'" class="fas fa-eye-slash"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue'
import ItemModifierText from '../ui/ItemModifierText.vue'
import { Config } from '@/web/Config'
import { PreparedStat } from './prepare-map-stats'
import { MapCheckWidget } from '../overlay/interfaces'

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
      return Config.store.widgets.find(widget => widget.wmType === 'map-check') as MapCheckWidget
    })

    const entryInSelected = computed(() => {
      return config.value.selectedStats.find(_ => _.matcher === props.stat.matcher)
    })

    const state = computed(() => {
      if (!entryInSelected.value) return undefined

      const valueDanger = Number(entryInSelected.value.valueDanger || 'NaN')
      const valueWarning = Number(entryInSelected.value.valueWarning || 'NaN')
      const valueDesirable = Number(entryInSelected.value.valueDesirable || 'NaN')

      if (entryInSelected.value.valueDanger !== '' && Number.isNaN(valueDanger)) {
        return 'danger'
      }
      if (entryInSelected.value.valueWarning !== '' && Number.isNaN(valueWarning)) {
        return 'warning'
      }
      if (entryInSelected.value.valueDesirable !== '' && Number.isNaN(valueDesirable)) {
        return 'desirable'
      }

      if (!entryInSelected.value.invert) {
        if (!Number.isNaN(valueDanger) && props.stat.roll! >= valueDanger) {
          return 'danger'
        }
        if (!Number.isNaN(valueWarning) && props.stat.roll! >= valueWarning) {
          return 'warning'
        }
        if (!Number.isNaN(valueDesirable) && props.stat.roll! >= valueDesirable) {
          return 'desirable'
        }
      } else {
        if (!Number.isNaN(valueDanger) && props.stat.roll! <= valueDanger) {
          return 'danger'
        }
        if (!Number.isNaN(valueWarning) && props.stat.roll! <= valueWarning) {
          return 'warning'
        }
        if (!Number.isNaN(valueDesirable) && props.stat.roll! <= valueDesirable) {
          return 'desirable'
        }
      }

      return 'not-matched'
    })

    const canCycle = computed(() => {
      const values = [
        entryInSelected.value!.valueDanger,
        entryInSelected.value!.valueWarning,
        entryInSelected.value!.valueDesirable
      ]
      return (
        values.filter(_ => _ === '+').length === 1 &&
        values.filter(_ => _ === '').length === 2
      )
    })

    return {
      state,
      handleClick () {
        if (!entryInSelected.value) {
          config.value.selectedStats.push({
            matcher: props.stat.matcher,
            invert: false,
            valueDanger: '+',
            valueWarning: '',
            valueDesirable: ''
          })
          return
        }

        if (!canCycle.value) return

        if (entryInSelected.value.valueDanger === '+') {
          entryInSelected.value.valueDanger = ''
          entryInSelected.value.valueWarning = '+'
        } else if (entryInSelected.value.valueWarning === '+') {
          entryInSelected.value.valueWarning = ''
          entryInSelected.value.valueDesirable = '+'
        } else if (entryInSelected.value.valueDesirable === '+') {
          config.value.selectedStats = config.value.selectedStats.filter(selected => selected !== entryInSelected.value)
        }
      }
    }
  }
})
</script>
