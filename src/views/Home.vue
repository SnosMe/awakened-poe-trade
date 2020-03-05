<template>
  <div class="flex-grow flex h-full">
    <div v-if="browserMode"
      class="w-full layout-column" style="width: calc(100% - 460px);">
      <browser-mode />
    </div>
    <div class="flex-grow layout-column">
      <app-titlebar @close="hideWindow" title="Awakened PoE Trade" />
      <div class="flex-grow layout-column">
        <router-view/>
        <div id="home" class="flex-grow flex h-full">
          <div class="flex-1"></div>
          <div class="layout-column w-full" style="max-width: 460px;">
            <app-bootstrap />
            <checked-item />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppTitlebar from '../components/AppTitlebar'
import BrowserMode from '../components/BrowserMode'
import CheckedItem from '../components/CheckedItem'
import AppBootstrap from '../components/AppBootstrap'
import { MainProcess } from '../components/main-process-bindings'

export default {
  components: {
    CheckedItem,
    AppBootstrap,
    AppTitlebar,
    BrowserMode
  },
  computed: {
    browserMode () {
      return !MainProcess.isElectron
    }
  },
  methods: {
    hideWindow () {
      MainProcess.priceCheckHide()
    }
  }
}
</script>
