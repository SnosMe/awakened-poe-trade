<template>
  <div id="home" class="flex-grow flex h-full">
    <div class="flex-1"></div>
    <div class="layout-column w-full" style="max-width: 460px;">
      <app-bootstrap />
      <checked-item />
    </div>
  </div>
</template>

<script>
import CheckedItem from '@/components/CheckedItem'
import AppBootstrap from '../components/AppBootstrap'

export default {
  components: {
    CheckedItem,
    AppBootstrap
  }
}
</script>
