<template>
  <widget :config="config" readonly :hideable="false" :removable="false" move-handles="corners">
    <div class="bg-gray-900 rounded py-1 pr-1 flex items-center text-base">
      <template v-for="widget in wm.widgets">
        <button v-if="!widget.wmFlags.includes('skip-menu') && widget.wmWants === 'hide'" :key="widget.wmId" @click="wm.show(widget.wmId)"
          class="bg-gray-800 rounded text-gray-100 ml-1 p-2 leading-none whitespace-no-wrap">{{ widget.wmTitle || `#${widget.wmId}` }}</button>
      </template>
      <ui-popper :delayOnMouseOut="150">
        <template slot="reference">
          <button class="rounded text-gray-600 ml-1 px-2 py-1 leading-none"><i class="fas fa-ellipsis-h"></i></button>
        </template>
        <div class="popper">
          <div class="flex flex-col justify-center text-base text-left">
            <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap">Chromatic calculator</button> -->
            <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap">Screen saver</button> -->
            <!-- add widget -->
            <!-- <div class="text-gray-600 text-sm px-1 select-none mt-2 whitespace-no-wrap">add widget</div> -->
            <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('timer')">Timer</button>
            <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('inventory-search')">Inventory search</button>
            <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('TODO')">Image</button> -->
          </div>
        </div>
      </ui-popper>
    </div>
  </widget>
</template>

<script>
import Widget from './Widget'

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
    return {
    }
  },
  computed: {
  },
  methods: {
    createOfType (type) {
      this.wm.create(type)
    }
  }
}
</script>

<style lang="postcss" module>
</style>
