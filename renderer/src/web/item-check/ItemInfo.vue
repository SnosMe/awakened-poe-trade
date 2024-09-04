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
    <div v-if="uniqueItemDisenchantingList" class="grid mx-auto gap-x-4 my-2" style="grid-template-columns: auto auto;">
      <div class="grid grid-cols-2 gap-2 overflow-auto pb-4 px-4">
        <div v-for="uniqueItemDisenchanting in uniqueItemDisenchantingList" class="flex">
          <div class="bg-gray-700 rounded flex gap-x-3 items-center p-2 w-full">
            <img :src="uniqueItemDisenchanting.icon" class="w-12" />
            <div class="leading-tight text-left">
              <div>{{ uniqueItemDisenchanting.name }}</div>
              <div>
                <img class="w-5" style="float: left" src="data:image/png;base64,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" />
                <span style="padding-left: 2px;">{{ uniqueItemDisenchanting.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemRarity, type ParsedItem } from '@/parser'
import * as actions from './hotkeyable-actions'
import { ITEMS_ITERATOR, DISENCHANT_UNIQUE_ITEMS_ITERATOR, CLIENT_STRINGS } from '@/assets/data'

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

const uniqueItemDisenchantingList = computed(() => {
  const { item } = props

  // TODO: Improve condition to check only items that can be disenchanting. Checking by `item.category` can help but it's not sure.
  if (item.rarity !== ItemRarity.Unique) return undefined

  const refName = item!.info.refName
  const possibleItems: {name: string, refName: string, icon: string}[] = []

  if (item.isUnidentified) {
    for (const match of ITEMS_ITERATOR(JSON.stringify(refName))) {
      if (match.namespace === 'UNIQUE' && match.unique!.base === refName) {
        possibleItems.push({ name: match.name, refName: match.refName, icon: match.icon })
      }
    }
  } else {
    possibleItems.push({ name: item.info.name, refName: refName, icon: item.info.icon })
  }

  const items: {name: string, value: string, icon: string}[] = []
  const ilvl = item.itemLevel || 0
  // 50% increased Thaumaturgic Dust per Influence Type
  let increaseByFactors = item.influences.length * 50

  // 1% increased Thaumaturgic Dust per Item Quality
  if (item.quality) {
    increaseByFactors += item.quality
  } else {
    // Checking the catalyst quality
    const catalystQualityStr = CLIENT_STRINGS.QUALITY.slice(0, -2) + ' ('
    const lines = item.rawText.split(/\r?\n/)

    for (const line of lines) {
      if (line.startsWith(catalystQualityStr)) {
        // "Quality (Elemental Damage Modifiers): +20% (augmented)"
        increaseByFactors += parseInt(line.match(/\d+/)?.join('') || '0', 10)
        break
      }
    }
  }

  if (item.isCorrupted) {
    for (const mod of item.newMods) {
      // 50% increased Thaumaturgic Dust per Corruption Implicit
      if (mod.info.generation === 'corrupted') {
        increaseByFactors += 50
      }
    }
  }

  // Per Influence + Corrupt + Quality
  const factorsMultiplier = (increaseByFactors + 100) / 100
  // Formula from https://poedb.tw/us/Kingsmarch#Disenchant
  const globalMultiplier = 100 * (20 - (84 - Math.min(Math.max(65, ilvl), 84))) * factorsMultiplier

  for (const entry of possibleItems) {
    for (const match of DISENCHANT_UNIQUE_ITEMS_ITERATOR(JSON.stringify(entry.refName))) {
      if (match.name === entry.refName) {
        items.push({ name: entry.name, value: Math.round(match.dustAmount * globalMultiplier).toLocaleString('en-us'), icon: entry.icon })
      }
    }
  }

  return items
})

const itemName = computed(() => props.item.info.name)
</script>
