<template>
  <div id="app" class="text-sm font-fontin-small-caps">
    <app-titlebar />
    <div id="nav">
      <app-bootstrap />
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script>
import AppTitlebar from './components/AppTitlebar'
import AppBootstrap from './components/AppBootstrap'

export default {
  components: {
    AppTitlebar,
    AppBootstrap
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
  background: theme('colors.gray.900');
}
</style>
