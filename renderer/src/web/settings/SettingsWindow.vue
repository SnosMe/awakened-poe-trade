<template>
<div>
  <div :class="$style.podium" v-if="podiumVisible">
    <div v-for="i in [2, 4, 5, 3, 1]">
      <div v-for="patron in patrons[i - 1]" :key="patron.from"
        :class="[$style.rating, $style[`rating-${patron.style}`]]"
        >{{ patron.from }}{{ (patron.months > 1) ? ` x${patron.months}` : null }}</div>
    </div>
  </div>
  <div :class="[$style.patronsHorizontal, { 'invisible': podiumVisible }]" :onMouseenter="showPodium">
    <div class="bg-gray-800 rounded p-1 justify-center text-center w-44 shrink-0 flex items-center">
      {{ t('settings.thank_you') }}
    </div>
    <div class="overflow-x-hidden whitespace-nowrap p-1 text-base">
      <span :class="$style.patronsLine">{{ patronsString[0] }}</span><br>
      <span :class="$style.patronsLine">{{ patronsString[1] }}</span>
    </div>
  </div>
  <div :class="$style.window" class="grow layout-column" :onMouseenter="hidePodium">
    <AppTitleBar @close="cancel" :title="t('settings.title')" />
    <div class="flex grow min-h-0">
      <div class="pl-2 pt-2 bg-gray-900 flex flex-col gap-1" style="min-width: 10rem;">
        <template v-for="item of menuItems">
          <button v-if="item.type === 'menu-item'"
            @click="item.select" :class="[$style['menu-item'], { [$style['active']]: item.isSelected }]">{{ item.name }}</button>
          <div v-else
            class="border-b mx-2 border-gray-800" />
        </template>
        <button v-if="menuItems.length >= 4"
          :class="$style['quit-btn']" @click="quit">{{ t('app.quit') }}</button>
        <div class="text-gray-400 text-center mt-auto pr-3 pt-4 pb-12" style="max-width: fit-content; min-width: 100%;">
          <img class="mx-auto mb-1" src="/images/peepoLove2x.webp">
          {{ t('Support development on') }}<br> <a href="https://patreon.com/awakened_poe_trade" class="inline-flex mt-1" target="_blank"><img class="inline h-5" src="/images/Patreon.svg"></a>
        </div>
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
import { defineComponent, shallowRef, computed, Component, PropType, nextTick, inject, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppConfig, updateConfig, saveConfig, pushHostConfig, Config } from '@/web/Config'
import { APP_PATRONS } from '@/assets/data'
import { Host } from '@/web/background/IPC'
import type { Widget, WidgetManager } from '@/web/overlay/interfaces'
import AppTitleBar from '@/web/ui/AppTitlebar.vue'
import SettingsHotkeys from './hotkeys.vue'
import SettingsChat from './chat.vue'
import SettingsGeneral from './general.vue'
import SettingsAbout from './about.vue'
import SettingsPricecheck from './price-check.vue'
import SettingsItemcheck from './item-check.vue'
import SettingsDebug from './debug.vue'
import SettingsMaps from './maps/maps.vue'
import SettingsStashSearch from './stash-search.vue'
import SettingsStopwatch from './stopwatch.vue'
import SettingsItemSearch from './item-search.vue'

function shuffle<T> (array: T[]): T[] {
  let currentIndex = array.length
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--;
    [array[currentIndex], array[randomIndex]] =
      [array[randomIndex], array[currentIndex]]
  }
  return array
}

function quit () {
  Host.sendEvent({
    name: 'CLIENT->MAIN::user-action',
    payload: { action: 'quit' }
  })
}

export default defineComponent({
  components: { AppTitleBar },
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

    const podiumVisible = shallowRef(false)
    const patrons = shallowRef<Array<typeof APP_PATRONS>>([])

    const configClone = shallowRef<Config | null>(null)
    watch(() => props.config.wmWants, (wmWants) => {
      if (wmWants === 'show') {
        configClone.value = reactive(JSON.parse(JSON.stringify(AppConfig())))
        patrons.value = [1, 2, 3, 4, 5].map(i =>
          shuffle(APP_PATRONS.filter(row => row.style === i))
        )
      } else {
        configClone.value = null
        if (selectedWmId.value != null) {
          selectedWmId.value = null
          selectedComponent.value = SettingsHotkeys
        }
        podiumVisible.value = false
      }
    })

    const selectedWmId = shallowRef<number | null>(null)
    const configWidget = computed(() => configClone.value?.widgets.find(w => w.wmId === selectedWmId.value))

    watch(() => props.config.wmFlags, (wmFlags) => {
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
        pushHostConfig()

        wm.hide(props.config.wmId)
      },
      cancel () {
        wm.hide(props.config.wmId)
      },
      quit,
      menuItems,
      selectedComponent,
      configClone,
      configWidget,
      patrons,
      patronsString: computed(() => {
        return [true, false].map(firstHalf => {
          return patrons.value.flatMap(tier => {
            const half = Math.ceil(tier.length / 2)
            tier = (firstHalf) ? tier.slice(0, half) : tier.slice(half)
            return tier.map(e => e.from)
          }).reverse().join(' • ')
        })
      }),
      podiumVisible,
      showPodium () { podiumVisible.value = true },
      hidePodium () { podiumVisible.value = false }
    }
  }
})

function menuByType (type?: string) {
  switch (type) {
    case 'stash-search':
      return [[SettingsStashSearch]]
    case 'timer':
      return [[SettingsStopwatch]]
    case 'item-check':
      return [[SettingsItemcheck, SettingsMaps]]
    case 'price-check':
      return [[SettingsPricecheck]]
    case 'item-search':
      return [[SettingsItemSearch]]
    default:
      return [
        [SettingsHotkeys, SettingsChat],
        [SettingsGeneral],
        [SettingsPricecheck, SettingsMaps, SettingsItemcheck],
        [SettingsDebug, SettingsAbout]
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

.quit-btn {
  @apply text-gray-600;
  @apply border border-gray-800;
  @apply p-1 mt-2 mr-2 rounded;

  &:hover {
    @apply text-red-400;
    @apply border-red-400;
  }
}

.patronsHorizontal {
  @apply bg-gray-900 p-1 rounded gap-1;
  position: absolute;
  top: 40rem; left: 0; right: 0;
  margin: 0 auto;
  max-width: 50rem;
  display: flex;
  &:global {
    animation-name: slideInDown;
    animation-duration: 1s;
  }
}

@keyframes slide {
  0% { transform: translate(0%, 0); }
  4% { transform: translate(0%, 0); }
  100% { transform: translate(-99%, 0); }
}
.patronsLine {
  display: inline-block;
  animation: slide 64s linear infinite;
}

.podium {
  display: flex;
  position: absolute;
  top: auto;
  bottom: max(0px, calc((100% - 38rem) / 2 - 10rem));
  align-items: flex-end;
  width: 100%;
  justify-content: center;
  @apply gap-4 p-4;
  &:global {
    animation-name: fadeIn;
    animation-duration: 1.5s;
  }
}
.podium > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  min-width: min-content;
}
.podium > div:nth-child(1) { max-width: 18rem; }
.podium > div:nth-child(2) { max-width: 16rem; }
.podium > div:nth-child(3) { flex-direction: column; align-items: center; }
.podium > div:nth-child(4) { max-width: 24rem; }
.podium > div:nth-child(5) { max-width: 18rem; }

.rating {
  min-width: 3rem;
  text-align: center;
  white-space: nowrap;
  @apply px-1 border;
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
