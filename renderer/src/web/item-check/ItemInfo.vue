<template>
  <div :class="$style.widget">
    <div :class="$style.itemName">{{ itemName }}</div>
    <div :class="$style.actionBtns">
      <button class="btn flex-1" @click="openWiki">wiki</button>
      <button class="btn flex-1" @click="openPoedb">poedb</button>
      <button v-if="showCoE" class="btn flex-1" @click="openCoE">CoE</button>
      <i class="fa-solid fa-ellipsis-vertical text-content-muted"></i>
      <button class="btn flex-1 whitespace-nowrap" @click="stashSearch">{{ t('item.find_in_stash') }}</button>
    </div>
    <div v-if="weaponDPS" :class="$style.itemInfo">
      <div class="grid">
        <div>{{ t('item.physical_dps') }}</div>
        <div>{{ weaponDPS.phys }}</div>
        <div>{{ t('item.elemental_dps') }}</div>
        <div>{{ weaponDPS.elem }}</div>
        <div>{{ t('item.total_dps') }}</div>
        <div>{{ weaponDPS.total }}</div>
      </div>
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

<style lang="postcss" module>
.widget {
  display: flex;
  flex-direction: column;
  background: rgb(var(--c-surface-base));
  color: rgb(var(--c-text-body));
  padding: theme('borderWidth.4');
  min-width: 20rem;
  max-width: min(100vw - var(--game-panel), 30rem);
}

.itemName {
  padding: theme('spacing.1') theme('spacing.4');
  text-align: center;
}

.actionBtns {
  display: flex;
  align-items: center;
  gap: theme('spacing.1');
  padding: theme('spacing.1') 0;
}

.itemInfo {
  display: flex;
  justify-content: center;
  background: rgb(var(--c-surface-raised));
  padding: theme('spacing.2') 0;

  & > :global(.grid) {
    grid-template-columns: auto auto;
    gap: 0 theme('spacing.4');

    & > div:nth-child(even) {
      text-align: right;
    }
  }
}
</style>
