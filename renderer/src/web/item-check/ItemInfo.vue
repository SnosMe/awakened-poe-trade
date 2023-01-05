<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4 flex flex-col"
    style="min-width: 20rem; max-width: min(100vw - var(--game-panel), 30rem);">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ itemName }}</div>
    <div class="flex gap-1 py-1 bg-gray-900 items-center">
      <button class="btn flex-1" @click="openWiki">wiki</button>
      <button class="btn flex-1" @click="openPoedb">poedb</button>
      <button v-if="showCoE" class="btn flex-1" @click="openCoE">CoE</button>
      <i class="fa-solid fa-ellipsis-vertical text-gray-600"></i>
      <button class="btn flex-1 whitespace-nowrap" @click="stashSearch">{{ t('Find in Stash') }}</button>
    </div>
    <div v-if="weaponDPS" class="grid mx-auto gap-x-4 my-2" style="grid-template-columns: auto auto;">
      <div>{{ t('Physical DPS:') }}</div><div class="text-right">{{ weaponDPS.phys }}</div>
      <div>{{ t('Elemental DPS:') }}</div><div class="text-right">{{ weaponDPS.elem }}</div>
      <div>{{ t('Total DPS:') }}</div><div class="text-right">{{ weaponDPS.total }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import * as actions from './hotkeyable-actions'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      stashSearch () { actions.findSimilarItems(props.item) },
      openWiki () { actions.openWiki(props.item) },
      openPoedb () { actions.openPoedb(props.item) },
      openCoE () { actions.openCoE(props.item) },
      showCoE: computed(() => {
        const { item } = props
        return item.info.craftable && !item.isCorrupted && !item.isMirrored
      }),
      weaponDPS: computed(() => {
        const { item } = props
        if (!item.weaponAS) return undefined
        const pdps = Math.round(item.weaponAS * (item.weaponPHYSICAL ?? 0))
        const edps = Math.round(item.weaponAS * (item.weaponELEMENTAL ?? 0))
        return { phys: pdps, elem: edps, total: pdps + edps }
      }),
      itemName: computed(() => props.item.info.name)
    }
  }
})
</script>

<i18n>
{
  "ru": {
    "Physical DPS:": "Физический ДПС:",
    "Elemental DPS:": "Стихийный ДПС:",
    "Total DPS:": "Общий ДПС:",
    "Find in Stash": "Найти в тайнике"
  },
  "cmn-Hant": {
    "Physical DPS:": "物理 DPS: #",
    "Elemental DPS:": "元素 DPS: #",
    "Total DPS:": "DPS: #"
  },
  "zh_CN": {
    "itemName": "物品名称",
    "Physical DPS:": "物理 DPS: #",
    "Elemental DPS:": "元素 DPS: #",
    "Total DPS:": "DPS: #"
  }
}
</i18n>
