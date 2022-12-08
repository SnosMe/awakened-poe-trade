<template>
  <widget :config="config" :hideable="false" :removable="false" move-handles="corners" v-slot="{ isEditing }">
    <div class="widget-default-style">
      <div class="py-1 pr-1 flex items-center text-base">
        <template v-for="widget in widgets" :key="widget.wmId">
          <button @click="toggle(widget)"
            :class="widget.wmWants === 'show' ? 'border-gray-500' : 'border-gray-900'"
            class="bg-gray-800 rounded text-gray-100 ml-1 p-2 leading-none whitespace-nowrap border"
          >
            <i v-if="widget.wmType === 'settings'" class="fas fa-cog align-bottom" />
            <i v-else-if="widget.wmType === 'item-search'" class="fas fa-search align-bottom" />
            <template v-else>{{ widget.wmTitle || `#${widget.wmId}` }}</template>
          </button>
        </template>
        <ui-popover>
          <template #target>
            <button class="rounded text-gray-600 ml-1 px-2 py-1 leading-none"><i class="fas fa-ellipsis-h"></i></button>
          </template>
          <template #content>
            <div class="flex flex-col justify-center text-base">
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap">Chromatic calculator</button> -->
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap">Screen saver</button> -->
              <!-- add widget -->
              <div class="text-gray-600 text-sm px-1 select-none whitespace-nowrap">{{ t('add widget') }}</div>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('timer')">{{ t('Stopwatch') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('stash-search')">{{ t('Stash search') }}</button>
              <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('image-strip')">{{ t('Image strip') }}</button>
              <!-- <button class="text-left hover:bg-gray-400 rounded px-1 whitespace-nowrap" @click="createOfType('TODO')">Image</button> -->
            </div>
          </template>
        </ui-popover>
      </div>
      <div v-if="isEditing" class="text-gray-100 px-2 pb-1 whitespace-nowrap">
        <ui-toggle v-model="config.alwaysShow">{{ t('Show button for active widgets') }}</ui-toggle>
      </div>
    </div>
  </widget>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { Widget as IWidget, WidgetManager, WidgetMenu } from './interfaces'
import Widget from './Widget.vue'
import { useI18n } from 'vue-i18n'

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

    const { t } = useI18n()

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
      }
    }
  }
})
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
  },
  "zh_CN": {
    "Stopwatch": "计时器",
    "Stash search": "仓库页搜索",
    "Image strip": "图示",
    "Show button for active widgets": "显示激活组件按钮",
    "add widget": "添加组件"
  },
  "cmn-Hant": {
    "Stopwatch": "計時器",
    "Stash search": "倉庫頁搜索",
    "Image strip": "圖示",
    "Show button for active widgets": "顯示激活組件按鈕",
    "add widget": "添加組件"
  }
}
</i18n>
