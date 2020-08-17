<template>
  <widget :config="config" :hideable="false" :removable="false" move-handles="corners" v-slot="{ isEditing }">
    <div class="widget-default-style">
      <div class="py-1 pr-1 flex items-center text-base">
        <template v-for="widget in widgets">
          <button :key="widget.wmId" @click="toggle(widget)"
            :class="widget.wmWants === 'show' ? 'border-gray-500' : 'border-gray-900'"
            class="bg-gray-800 rounded text-gray-100 ml-1 p-2 leading-none whitespace-no-wrap border">{{ widget.wmTitle || `#${widget.wmId}` }}</button>
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
              <div class="text-gray-600 text-sm px-1 select-none whitespace-no-wrap">{{ $t('add widget') }}</div>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('timer')">{{ $t('Stopwatch') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('stash-search')">{{ $t('Stash search') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('image-strip')">{{ $t('Image strip') }}</button>
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-no-wrap" @click="createOfType('TODO')">Image</button> -->
            </div>
          </div>
        </ui-popper>
      </div>
      <div v-if="isEditing" class="text-gray-100 px-2 pb-1 whitespace-no-wrap">
        <ui-toggle v-model="config.alwaysShow">{{ $t('Show button for active widgets') }}</ui-toggle>
      </div>
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
  computed: {
    widgets () {
      return this.wm.widgets.filter(widget =>
        !widget.wmFlags.includes('skip-menu') &&
        (this.config.alwaysShow || (widget.wmWants === 'hide'))
      )
    }
  },
  methods: {
    createOfType (type) {
      this.wm.create(type)
    },
    toggle (widget) {
      if (widget.wmWants === 'hide') {
        this.wm.show(widget.wmId)
      } else {
        this.wm.hide(widget.wmId)
      }
    }
  }
}
</script>

<style lang="postcss" module>
</style>

<i18n>
{
  "ru": {
    "Stopwatch": "Секундомер",
    "Stash search": "Поиск в тайнике",
    "Image strip": "Лента изображений",
    "Show button for active widgets": "Показывать кнопку для активных виджетов",
    "add widget": "добавить виджет"
  }
}
</i18n>
