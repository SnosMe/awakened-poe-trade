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
@import url('https://use.fontawesome.com/releases/v5.2.0/css/all.css');
@import url('https://web.poecdn.com/css/font.css');
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
