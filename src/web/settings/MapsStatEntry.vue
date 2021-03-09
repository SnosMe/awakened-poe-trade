<template>
  <div class="flex py-1 w-full" :class="$style.row">
    <div class="flex-1 truncate px-2">{{ matcher }}</div>
    <div class="flex" :class="{ [$style.controlsAutoHide]: !entryInSelected }">
      <div class="pr-1"><ui-toggle v-model="invert" /></div>
      <div><input v-model.trim="valueWarning" @focus="handleFocus($event, 'valueWarning')" :placeholder="t(!invert ? 'min' : 'max')" class="bg-gray-900 w-12 text-center rounded-l"></div>
      <div><input v-model.trim="valueDanger" @focus="handleFocus($event, 'valueDanger')" :placeholder="t(!invert ? 'min' : 'max')" class="bg-gray-900 w-12 text-center mx-px"></div>
      <div><input v-model.trim="valueDesirable" @focus="handleFocus($event, 'valueDesirable')" :placeholder="t(!invert ? 'min' : 'max')" class="bg-gray-900 w-12 text-center rounded-r"></div>
      <div class="flex w-6">
        <button v-if="entryInSelected"
          @click="remove"
          class="mx-1 leading-none flex items-center"><i class="fas fa-times w-4"></i></button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Config } from '@/web/Config'
import { ItemCheckWidget } from '../overlay/interfaces'

export default defineComponent({
  emits: [],
  props: {
    matcher: {
      type: String,
      required: true
    },
    autoRemove: {
      type: Boolean,
      required: true
    }
  },
  setup (props) {
    const config = computed(() => {
      return Config.store.widgets.find(widget => widget.wmType === 'item-check') as ItemCheckWidget
    })
    const entryInSelected = computed(() => {
      return config.value.maps.selectedStats.find(_ => _.matcher === props.matcher)
    })

    const invert = computed<boolean>({
      get () { return entryInSelected.value?.invert ?? false },
      set (value) { setProp('invert', value) }
    })
    const valueWarning = computed<string>({
      get () { return entryInSelected.value?.valueWarning ?? '' },
      set (value) { setProp('valueWarning', value) }
    })
    const valueDanger = computed<string>({
      get () { return entryInSelected.value?.valueDanger ?? '' },
      set (value) { setProp('valueDanger', value) }
    })
    const valueDesirable = computed<string>({
      get () { return entryInSelected.value?.valueDesirable ?? '' },
      set (value) { setProp('valueDesirable', value) }
    })

    function setProp<T extends keyof ItemCheckWidget['maps']['selectedStats'][number]> (
      key: T,
      value: ItemCheckWidget['maps']['selectedStats'][number][T]
    ) {
      if (entryInSelected.value) {
        entryInSelected.value[key] = value
        if (props.autoRemove) {
          removeIfNotUsed()
        }
      } else {
        config.value.maps.selectedStats.push({
          matcher: props.matcher,
          invert: false,
          valueWarning: '',
          valueDanger: '',
          valueDesirable: '',
          ...{ [key]: value }
        })
      }
    }

    function removeIfNotUsed () {
      if (
        entryInSelected.value &&
        !entryInSelected.value.invert &&
        entryInSelected.value.valueWarning === '' &&
        entryInSelected.value.valueDanger === '' &&
        entryInSelected.value.valueDesirable === ''
      ) {
        remove()
      }
    }

    function remove () {
      if (!entryInSelected.value) return

      config.value.maps.selectedStats = config.value.maps.selectedStats
        .filter(selected => selected !== entryInSelected.value)
    }

    function handleFocus (e: FocusEvent, type: 'valueWarning' | 'valueDanger' | 'valueDesirable') {
      const target = e.target as HTMLInputElement
      if (target.value === '') {
        ;({
          valueWarning,
          valueDanger,
          valueDesirable
        })[type].value = '+'

        nextTick(() => {
          target.select()
        })
      } else {
        target.select()
      }
    }

    const { t } = useI18n()

    return {
      t,
      entryInSelected,
      invert,
      valueWarning,
      valueDanger,
      valueDesirable,
      remove,
      handleFocus
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
