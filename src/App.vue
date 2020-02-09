<template>
  <div id="app" class="text-sm font-fontin-small-caps bg-gray-800">
    <div v-if="browserMode"
      class="w-full layout-column" style="width: calc(100% - 460px);">
      <BrowserMode />
    </div>
    <div class="flex-grow layout-column">
      <app-titlebar style="align-self: stretch;" />
      <div class="flex-grow layout-column">
        <router-view/>
      </div>
    </div>
  </div>
</template>

<script>
import AppTitlebar from './components/AppTitlebar'
import BrowserMode from './components/BrowserMode'
import { MainProcess } from './components/main-process-bindings'

export default {
  components: {
    AppTitlebar,
    BrowserMode
  },
  computed: {
    browserMode () {
      return !MainProcess.isElectron
    }
  }
}
</script>

<style lang="postcss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css');
@import url('https://web.poecdn.com/css/font.css');
@tailwind base;
@tailwind components;
@tailwind utilities;

.table-stripped tbody tr:nth-child(odd) {
  background: #353f52;
}

#app {
  height: 100vh;
  display: flex;
  /* align-items: center; */
  overflow: hidden;
  justify-content: space-between;

  :focus {
    outline: 0;
  }
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

::-webkit-scrollbar {
  width: 14px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
}

::-webkit-scrollbar-thumb {
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
}

.btn {
  @apply bg-gray-700;
  @apply px-2 py-1;
  @apply text-gray-400;
  @apply leading-none;
  @apply rounded;
}

.btn-icon {
  @apply text-xs text-gray-600;
}
</style>
