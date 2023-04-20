<template>
  <widget :config="config" :hideable="false" :removable="false" move-handles="corners" v-slot="{ isEditing }">
    <div class="widget-default-style">
      <div class="p-1 flex gap-1 items-center text-base">
        <template v-for="widget in widgets" :key="widget.wmId">
          <button @click="toggle(widget)"
            :class="widget.wmWants === 'show' ? 'border-gray-500' : 'border-gray-800'"
            class="bg-gray-800 rounded text-gray-100 p-2 leading-none whitespace-nowrap border"
          >
            <i v-if="widget.wmType === 'settings'" class="fas fa-cog align-bottom" />
            <i v-else-if="widget.wmType === 'item-search'" class="fas fa-search align-bottom" />
            <template v-else>{{ widget.wmTitle || `#${widget.wmId}` }}</template>
          </button>
        </template>
        <ui-popover>
          <template #target>
            <button class="rounded text-gray-600 px-2 py-1 leading-none"><i class="fas fa-ellipsis-h"></i></button>
          </template>
          <template #content>
            <div class="flex flex-col justify-center text-base">
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap">Chromatic calculator</button> -->
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap">Screen saver</button> -->
              <!-- add widget -->
              <div class="text-gray-600 text-sm px-1 select-none whitespace-nowrap">{{ t(':add') }}</div>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('timer')">{{ t('stopwatch.name') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('stash-search')">{{ t('stash_search.name') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('image-strip')">{{ t('image_strip.name') }}</button>
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('TODO')">Image</button> -->
            </div>
          </template>
        </ui-popover>
      </div>
      <div v-if="isEditing" class="text-gray-100 px-2 pb-1 whitespace-nowrap">
        <ui-toggle v-model="config.alwaysShow">{{ t(':always_show') }}</ui-toggle>
      </div>
      <div v-else class="px-1 pb-1">
        <textarea class="px-2 py-1.5 bg-gray-700 rounded resize-none block"
          rows="1" spellcheck="false"
          :placeholder="t(':price_check')" @input="handleItemPaste"></textarea>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { Widget as IWidget, WidgetManager, WidgetMenu } from './interfaces'
import { Host } from '@/web/background/IPC'
import Widget from './Widget.vue'
import { useI18nNs } from '@/web/i18n'

export default defineComponent({
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<WidgetMenu>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!

    const widgets = computed(() => {
      return [
        wm.widgets.value.find(widget => widget.wmType === 'settings')!,
        ...wm.widgets.value.filter(widget => widget.wmType !== 'settings')
      ].filter(widget =>
        !widget.wmFlags.includes('skip-menu') &&
        (props.config.alwaysShow || (widget.wmWants === 'hide'))
      )
    })

    const { t } = useI18nNs('widget_menu')

    return {
      t,
      widgets,
      createOfType (type: string) {
        wm.create(type)
      },
      toggle (widget: IWidget) {
        if (widget.wmWants === 'hide') {
          wm.show(widget.wmId)
        } else {
          wm.hide(widget.wmId)
        }
      },
      handleItemPaste (e: Event) {
        const target = e.target as HTMLInputElement
        const inputRect = target.getBoundingClientRect()
        Host.selfDispatch({
          name: 'MAIN->CLIENT::item-text',
          payload: {
            clipboard: target.value,
            position: {
              x: window.screenX + inputRect.x + inputRect.width / 2,
              y: window.screenY + inputRect.y + inputRect.height / 2
            },
            focusOverlay: true,
            target: 'price-check'
          }
        })
        target.value = ''
      }
    }
  }
})
</script>
