<script setup>
import { useData, withBase, useRoute } from 'vitepress'

const { site, theme } = useData()
const route = useRoute()
</script>

<template>
  <div class="max-w-screen-md mx-auto">
    <div id="site-header" class="flex items-center justify-between py-4 border-b mb-4">
      <a :href="withBase('/')" id="site-logo" class="flex items-center">
        <img src="pathname:///favicon.png">
        <span class="ml-4 font-semibold text-lg">{{ site.title }}</span>
      </a>
      <div class="flex text-sm gap-2">
        <a v-for="item in theme.socialLinks"
          class="text-white px-1" :style="{ background: item.color }"
          :href="item.link">{{ item.text }}</a>
      </div>
    </div>
    <div class="flex mb-4 items-start">
      <nav class="w-1/4 border shadow-sm rounded p-2 text-sm flex flex-col flex-shrink-0">
        <template v-for="group, i in theme.sidebar">
          <template v-for="item in group.items">
            <a v-if="route.path === withBase(`${item.link}.html`)"
              class="px-2 py-1 rounded m-px bg-gray-800 text-white"
              :href="withBase(item.link)">{{ item.text }}</a>
            <a v-else
              class="px-2 py-1 rounded m-px hover:bg-gray-200"
              :href="withBase(item.link)">{{ item.text }}</a>
          </template>
          <hr v-if="i < theme.sidebar.length - 1"
            class="my-1 mx-2">
        </template>
      </nav>
      <article class="w-3/4 ml-8 markdown-body">
        <Content />
      </article>
    </div>
  </div>
</template>

<style lang="postcss">
@import url('./style.css');
@tailwind base;
@tailwind utilities;

#site-logo img {
  width: 52px;
}
</style>
