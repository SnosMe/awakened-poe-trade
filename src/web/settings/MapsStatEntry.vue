<template>
  <div class="flex py-1" :class="$style.row">
    <div class="flex-1 truncate px-2">{{ stat.text }}</div>
    <div class="flex" :class="{ [$style.controlsAutoHide]: !entryInSelected }">
      <div class="pr-1"><ui-toggle v-model="invert" /></div>
      <div><input v-model.trim="valueWarning" @focus="handleFocus($event, 'valueWarning')" :placeholder="!invert ? 'min' : 'max'" class="bg-gray-900 w-12 text-center rounded-l"></div>
      <div><input v-model.trim="valueDanger" @focus="handleFocus($event, 'valueDanger')" :placeholder="!invert ? 'min' : 'max'" class="bg-gray-900 w-12 text-center mx-px"></div>
      <div><input v-model.trim="valueDesirable" @focus="handleFocus($event, 'valueDesirable')" :placeholder="!invert ? 'min' : 'max'" class="bg-gray-900 w-12 text-center rounded-r"></div>
      <div class="flex w-6">
        <button v-if="entryInSelected"
          @click="remove"
          class="mx-1 leading-none flex items-center"><i class="fas fa-times w-4"></i></button>
      </div>
    </div>
  </div>
</template>

<script>
import { Config } from '@/web/Config'

export default {
  props: {
    stat: {
      type: Object,
      required: true
    },
    autoRemove: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    invert: {
      get () { return this.entryInSelected ? this.entryInSelected.invert : false },
      set (value) { this.setProp('invert', value) }
    },
    valueWarning: {
      get () { return this.entryInSelected ? this.entryInSelected.valueWarning : '' },
      set (value) { this.setProp('valueWarning', value) }
    },
    valueDanger: {
      get () { return this.entryInSelected ? this.entryInSelected.valueDanger : '' },
      set (value) { this.setProp('valueDanger', value) }
    },
    valueDesirable: {
      get () { return this.entryInSelected ? this.entryInSelected.valueDesirable : '' },
      set (value) { this.setProp('valueDesirable', value) }
    },
    entryInSelected () {
      return this.config.selectedStats.find(_ => _.matchRef === this.stat.matchRef)
    },
    config () {
      return Config.store.widgets.find(widget => widget.wmType === 'map-check')
    }
  },
  methods: {
    setProp (key, value) {
      if (this.entryInSelected) {
        this.$set(this.entryInSelected, key, value)
        if (this.autoRemove) {
          this.removeIfNotUsed()
        }
      } else {
        this.config.selectedStats.push({
          matchRef: this.stat.matchRef,
          invert: false,
          valueWarning: '',
          valueDanger: '',
          valueDesirable: '',
          ...{ [key]: value }
        })
      }
    },
    removeIfNotUsed () {
      if (!this.entryInSelected) return

      if (
        !this.entryInSelected.invert &&
        this.entryInSelected.valueWarning === '' &&
        this.entryInSelected.valueDanger === '' &&
        this.entryInSelected.valueDesirable === ''
      ) {
        this.config.selectedStats = this.config.selectedStats.filter(selected => selected !== this.entryInSelected)
      }
    },
    remove () {
      if (!this.entryInSelected) return

      this.config.selectedStats = this.config.selectedStats.filter(selected => selected !== this.entryInSelected)
    },
    handleFocus (e, type) {
      if (e.target.value === '') {
        this[type] = '+'
        this.$nextTick(() => {
          e.target.select()
        })
      } else {
        e.target.select()
      }
    }
  }
}
</script>

<style lang="postcss" module>
:global(.vue-recycle-scroller__item-view.hover) :local(.row) {
  @apply bg-gray-700;
}

.controlsAutoHide {
  display: none;
}

:global(.vue-recycle-scroller__item-view.hover) :local(.controlsAutoHide) {
  display: flex;
}
</style>
