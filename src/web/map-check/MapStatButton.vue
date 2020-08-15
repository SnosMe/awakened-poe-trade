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
      <item-modifier-text :text="stat.text" :roll="stat.roll" class="truncate" />
    </button>
    <div class="flex leading-none items-center text-gray-600 w-8 text-center justify-center">
      <i v-if="state === 'not-matched'" class="fas fa-eye-slash"></i>
    </div>
  </div>
</template>

<script>
import ItemModifierText from '../ui/ItemModifierText'
import { Config } from '@/web/Config'

export default {
  components: { ItemModifierText },
  props: {
    stat: {
      type: Object,
      required: true
    }
  },
  computed: {
    state () {
      if (!this.entryInSelected) return undefined

      const valueDanger = Number(this.entryInSelected.valueDanger || 'NaN')
      const valueWarning = Number(this.entryInSelected.valueWarning || 'NaN')
      const valueDesirable = Number(this.entryInSelected.valueDesirable || 'NaN')

      if (this.entryInSelected.valueDanger !== '' && Number.isNaN(valueDanger)) {
        return 'danger'
      }
      if (this.entryInSelected.valueWarning !== '' && Number.isNaN(valueWarning)) {
        return 'warning'
      }
      if (this.entryInSelected.valueDesirable !== '' && Number.isNaN(valueDesirable)) {
        return 'desirable'
      }

      if (!this.entryInSelected.invert) {
        if (!Number.isNaN(valueDanger) && this.stat.roll >= valueDanger) {
          return 'danger'
        }
        if (!Number.isNaN(valueWarning) && this.stat.roll >= valueWarning) {
          return 'warning'
        }
        if (!Number.isNaN(valueDesirable) && this.stat.roll >= valueDesirable) {
          return 'desirable'
        }
      } else {
        if (!Number.isNaN(valueDanger) && this.stat.roll <= valueDanger) {
          return 'danger'
        }
        if (!Number.isNaN(valueWarning) && this.stat.roll <= valueWarning) {
          return 'warning'
        }
        if (!Number.isNaN(valueDesirable) && this.stat.roll <= valueDesirable) {
          return 'desirable'
        }
      }

      return 'not-matched'
    },
    entryInSelected () {
      return this.config.selectedStats.find(_ => _.matchRef === this.stat.matchRef)
    },
    config () {
      return Config.store.widgets.find(widget => widget.wmType === 'map-check')
    }
  },
  methods: {
    handleClick () {
      if (!this.entryInSelected) {
        this.config.selectedStats.push({
          matchRef: this.stat.matchRef,
          invert: false,
          valueDanger: '+',
          valueWarning: '',
          valueDesirable: ''
        })
        return
      }

      if (!this.canCycle()) return

      if (this.entryInSelected.valueDanger === '+') {
        this.entryInSelected.valueDanger = ''
        this.entryInSelected.valueWarning = '+'
      } else if (this.entryInSelected.valueWarning === '+') {
        this.entryInSelected.valueWarning = ''
        this.entryInSelected.valueDesirable = '+'
      } else if (this.entryInSelected.valueDesirable === '+') {
        this.config.selectedStats = this.config.selectedStats.filter(selected => selected !== this.entryInSelected)
      }
    },
    canCycle () {
      const values = [this.entryInSelected.valueDanger, this.entryInSelected.valueWarning, this.entryInSelected.valueDesirable]
      return (
        values.filter(_ => _ === '+').length === 1 &&
        values.filter(_ => _ === '').length === 2
      )
    }
  }
}
</script>
