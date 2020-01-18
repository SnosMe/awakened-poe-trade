<template>
  <div id="app" class="text-sm font-fontin-small-caps bg-gray-800">
    <app-titlebar style="align-self: stretch;" />
    <div class="flex-grow layout-column">
      <router-view/>
    </div>
  </div>
</template>

<script>
import AppTitlebar from './components/AppTitlebar'

export default {
  components: {
    AppTitlebar
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
  flex-direction: column;
  overflow: hidden;

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
</style>
