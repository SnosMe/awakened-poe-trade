<template>
<div>
  <div class="absolute animate__animated animate__fadeIn w-full h-full" @click="handlePatronsClick">
    <button v-for="patron in patrons" :key="patron.from"
      :class="[$style.rating, $style[`rating-${patron.style}`]]"
      :style="{ left: `${patron.left * 100}%`, top: `${patron.top * 100}%`, zIndex: patron.style }"
      >{{ patron.from }}{{ (patron.months > 1) ? ` x${patron.months}` : null }}</button>
  </div>
  <div :class="$style.window" class="grow layout-column">
    <app-titlebar @close="cancel" :title="t('Settings - Awakened PoE Trade')" />
    <div class="flex grow min-h-0">
      <div class="pl-2 pt-2 bg-gray-900 flex flex-col gap-1" style="min-width: 10rem;">
        <template v-for="item of menuItems">
          <button v-if="item.type === 'menu-item'"
            @click="item.select" :class="[$style['menu-item'], { [$style['active']]: item.isSelected }]">{{ item.name }}</button>
          <div v-else
            class="border-b mx-2 border-gray-800" />
        </template>
        <div class="text-gray-400 text-center mt-auto pr-3 pt-4 pb-12" style="max-width: fit-content; min-width: 100%;">{{ t('Support development on') }}<br> <a href="https://patreon.com/awakened_poe_trade" class="inline-flex mt-1" target="_blank"><img class="inline h-5" src="/images/Patreon.svg"></a></div>
      </div>
      <div class="text-gray-100 grow layout-column bg-gray-900">
        <div class="grow overflow-y-auto bg-gray-800 rounded-tl">
          <component v-if="configClone"
            :is="selectedComponent" :config="configClone" :configWidget="configWidget" />
        </div>
        <div class="border-t bg-gray-900 border-gray-600 p-2 flex justify-end gap-x-2">
          <button @click="save" class="px-3 bg-gray-800 rounded">{{ t('Save') }}</button>
          <button @click="cancel" class="px-3">{{ t('Cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, shallowRef, computed, Component, PropType, nextTick, inject, reactive, watch, triggerRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppConfig, updateConfig, saveConfig } from '@/web/Config'
import { APP_PATRONS } from '@/assets/data'
import type { Config } from '@ipc/types'
import type { Widget, WidgetManager } from '@/web/overlay/interfaces'
import SettingsHotkeys from './hotkeys.vue'
import SettingsChat from './chat.vue'
import SettingsGeneral from './general.vue'
import SettingsPricecheck from './price-check.vue'
import SettingsDebug from './debug.vue'
import SettingsMaps from './maps/maps.vue'
import SettingsStashSearch from './stash-search.vue'
import SettingsStopwatch from './stopwatch.vue'

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<Widget>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    nextTick(() => {
      props.config.wmWants = 'hide'
    })

    const selectedComponent = shallowRef<Component>(SettingsHotkeys)

    const patrons = shallowRef<Array<typeof APP_PATRONS[number] & { top: number, left: number }>>([])

    const configClone = shallowRef<Config | null>(null)
    watch(() => props.config.wmWants, (wmWants) => {
      if (wmWants === 'show') {
        configClone.value = reactive(JSON.parse(JSON.stringify(AppConfig())))
        patrons.value = APP_PATRONS.map(row => ({
          ...row, left: Math.random(), top: Math.random()
        }))
      } else {
        configClone.value = null
        if (selectedWmId.value != null) {
          selectedWmId.value = null
          selectedComponent.value = SettingsHotkeys
        }
      }
    })

    const selectedWmId = shallowRef<number | null>(null)
    const configWidget = computed(() => configClone.value?.widgets.find(w => w.wmId === selectedWmId.value))

    watch(() => props.config.wmFlags, (wmFlags) => {
      if (wmFlags.includes('settings:price-check')) {
        selectedComponent.value = SettingsPricecheck
        wm.setFlag(props.config.wmId, 'settings:price-check', false)
        return
      }
      const flagStr = wmFlags.find(flag => flag.startsWith('settings:widget:'))
      if (flagStr) {
        const _wmId = Number(flagStr.split(':')[2])
        const _widget = wm.widgets.value.find(w => w.wmId === _wmId)!
        selectedWmId.value = _wmId
        selectedComponent.value = menuByType(_widget.wmType)[0][0]
        wm.setFlag(props.config.wmId, flagStr, false)
      }
    }, { deep: true })

    const menuItems = computed(() => flatJoin(
      menuByType(configWidget.value?.wmType)
        .map(group => group.map(component => ({
          name: t(component.name),
          select () { selectedComponent.value = component },
          isSelected: (selectedComponent.value === component),
          type: 'menu-item' as const
        }))),
      () => ({ type: 'separator' as const })
    ))

    return {
      t,
      save () {
        updateConfig(configClone.value!)
        saveConfig()
        wm.hide(props.config.wmId)
      },
      cancel () {
        wm.hide(props.config.wmId)
      },
      menuItems,
      selectedComponent,
      configClone,
      configWidget,
      patrons,
      handlePatronsClick () {
        for (const box of patrons.value) {
          box.top += (Math.random() - 0.5) * 0.2
          box.left += (Math.random() - 0.5) * 0.1
          box.top = Math.min(Math.max(box.top, 0), 1)
          box.left = Math.min(Math.max(box.left, 0), 1)
        }
        triggerRef(patrons)
      }
    }
  }
})

function menuByType (type?: string) {
  switch (type) {
    case 'stash-search':
      return [[SettingsStashSearch]]
    case 'timer':
      return [[SettingsStopwatch]]
    default:
      return [
        [SettingsHotkeys, SettingsChat],
        [SettingsGeneral],
        [SettingsPricecheck, SettingsMaps],
        [SettingsDebug]
      ]
  }
}

function flatJoin<T, J> (arr: T[][], joinEl: () => J) {
  const out: Array<T | J> = []
  for (const nested of arr) {
    out.push(...nested)
    out.push(joinEl())
  }
  return out.slice(0, -1)
}
</script>

<style lang="postcss" module>
.window {
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
  margin: 0 auto;
  max-width: 50rem;
  max-height: 38rem;
  overflow: hidden;
  @apply bg-gray-800;
  @apply rounded-b;
  &:global {
    animation-name: slideInDown;
    animation-duration: 1s;
  }
}

.menu-item {
  text-align: left;
  @apply p-2;
  line-height: 1;
  @apply text-gray-600;
  @apply rounded-l;

  &:hover {
    @apply text-gray-100;
  }

  &.active {
    @apply text-gray-400;
    @apply bg-gray-800;
  }
}

.rating {
  position: absolute;
  min-width: 3rem;
  text-align: center;
  white-space: nowrap;
  @apply px-1 border;
  transform-origin: center;
  transform: translate(-50%, -50%);
  transition: top 0.2s linear, left 0.2s linear;
}

.rating-1 {
  background-color: rgb(0, 0, 0);
  color: rgb(190, 178, 135);
  border-color: currentColor;
  @apply text-base;
}
.rating-2 {
  background-color: rgb(210, 178, 135);
  color: rgb(0, 0, 0);
  border-color: currentColor;
  @apply text-lg;
}
.rating-3 {
  background-color: rgb(213, 159, 0);
  color: rgb(0, 0, 0);
  border-color: currentColor;
  @apply text-lg;
}
.rating-4 {
  background-color: rgb(240, 90, 35);
  color: rgb(255, 255, 255);
  border-color: currentColor;
  @apply text-xl;
}
.rating-5 {
  background-color: rgb(255, 255, 255);
  color: rgb(255, 0, 0);
  border-color: currentColor;
  @apply text-2xl;
}
</style>

<i18n>
{
  "ru": {
    "Settings - Awakened PoE Trade": "Настройки - Awakened PoE Trade",
    "Hotkeys": "Быстрые клавиши",
    "General": "Общие",
    "Price check": "Прайс-чек",
    "Maps": "Карты",
    "Debug": "Debug",
    "Chat": "Чат",
    "Stash search": "Поиск в тайнике",
    "Stopwatch": "Секундомер"
  }
}
</i18n>
