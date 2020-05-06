<template>
  <div>
    <div v-if="active" style="background: #fff; opacity: 0.15; top: 0; left: 0; height: 100%; width: 100%; position: absolute;"></div>
    <widget style="top: 16px; left: 16px;">
      <div v-if="active || true" class="bg-yellow-900 p-1 rounded flex">
        <button class="leading-none text-gray-100 py-2 px-3 rounded bg-yellow-800 mr-1">Map rolling</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded bg-yellow-800 mr-1">Dump filtering</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded bg-yellow-800 mr-1">+</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded bg-yellow-800">Syndicate</button>
      </div>
    </widget>
    <widget style="top: 100px; left: 450px;" v-slot="{ isEditing }">
      <div class="bg-yellow-900 p-1 rounded flex flex-col">
        <div class="text-gray-100" v-if="!isEditing">Map rolling</div>
        <input v-else value="Map rolling">
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">"Quantity: +3"</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">Reflect</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">"Cannot Leech Life"</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800">"Cannot Leech Mana"</button>
      </div>
    </widget>
    <widget style="top: 300px; left: 550px;">
      <div class="bg-yellow-900 p-1 rounded flex flex-col">
        <div class="text-gray-100">Dump filtering</div>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">Currency</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">Fragment</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800 mb-1">Divination</button>
        <button class="leading-none text-gray-100 py-2 px-3 rounded text-left bg-yellow-800">Prophecy</button>
      </div>
    </widget>
  </div>
</template>

<script>
import { MainProcess } from '@/ipc/main-process-bindings'
import Widget from './Widget'

export default {
  components: {
    Widget
  },
  data () {
    return {
      active: false
    }
  },
  created () {
    MainProcess.addEventListener('overlay-active-change', () => {
      this.active = !this.active
    })
  }
}
</script>
