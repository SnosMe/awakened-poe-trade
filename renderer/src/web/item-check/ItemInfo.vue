<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4 flex flex-col"
    style="min-width: 20rem; max-width: min(100vw - var(--game-panel), 30rem);">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ itemName }}</div>
    <div class="flex gap-1 py-1 bg-gray-900 items-center">
      <button class="btn flex-1" @click="openWiki">wiki</button>
      <button class="btn flex-1" @click="openPoedb">poedb</button>
      <button v-if="showCoE" class="btn flex-1" @click="openCoE">CoE</button>
      <i class="fa-solid fa-ellipsis-vertical text-gray-600"></i>
      <button class="btn flex-1 whitespace-nowrap" @click="stashSearch">{{ t('item.find_in_stash') }}</button>
    </div>
    <div v-if="weaponDPS" class="grid mx-auto gap-x-4 my-2" style="grid-template-columns: auto auto;">
      <div>{{ t('item.physical_dps') }}</div><div class="text-right">{{ weaponDPS.phys }}</div>
      <div>{{ t('item.elemental_dps') }}</div><div class="text-right">{{ weaponDPS.elem }}</div>
      <div>{{ t('item.total_dps') }}</div><div class="text-right">{{ weaponDPS.total }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import * as actions from './hotkeyable-actions'

const props = defineProps<{
  item: ParsedItem
}>()

const { t } = useI18n()

function stashSearch () { actions.findSimilarItems(props.item) }
function openWiki () { actions.openWiki(props.item) }
function openPoedb () { actions.openPoedb(props.item) }
function openCoE () { actions.openCoE(props.item) }

const showCoE = computed(() => {
  const { item } = props
  return item.info.craftable && !item.isCorrupted && !item.isMirrored
})

const weaponDPS = computed(() => {
  const { item } = props
  if (!item.weaponAS) return undefined
  const pdps = Math.round(item.weaponAS * (item.weaponPHYSICAL ?? 0))
  const edps = Math.round(item.weaponAS * (item.weaponELEMENTAL ?? 0))
  return { phys: pdps, elem: edps, total: pdps + edps }
})

const itemName = computed(() => props.item.info.name)
</script>
