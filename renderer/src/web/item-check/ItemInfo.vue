<template>
  <div class="bg-gray-800 text-gray-200 border-gray-900 border-4" style="min-width: 20rem;" :style="{ 'max-width': maxWidth }">
    <div class="bg-gray-900 py-1 px-4 text-center">{{ itemName }}</div>
    <div class="divide-y divide-gray-900">
      <table class="w-full">
        <tr class="align-top">
          <td class="text-right p-2"><span class="text-red-400">12 Str</span></td>
          <td class="p-2">+8 to Maximum life<br>+1 Melee Physical Damage</td>
        </tr>
        <tr class="align-top">
          <td class="text-right p-2"><span class="text-blue-400">10 Int</span></td>
          <td class="p-2">+8 Evenrgy Shield<br>+1 to Mana</td>
        </tr>
        <tr class="align-top">
          <td class="text-right p-2"><span class="text-green-400">8 Dex</span></td>
          <td class="p-2">+8 to Accuracy<br>+1 Evasion</td>
        </tr>
      </table>
      <div>
        <table class="w-full">
          <tr>
            <td class="text-right px-2 pt-2"><span class="text-red-400">24% Fire</span></td>
            <td class="text-right px-2 pt-2"><span class="text-yellow-400">15% Lightning</span></td>
            <td class="text-right px-2 pt-2"><span class="text-blue-400">12% Cold</span></td>
          </tr>
          <tr>
            <td class="text-right px-2 pb-2" colspan="3"><span class="">56% Total</span></td>
            <td class="text-right px-2 pb-2"><span class="text-pink-300">12% Chaos</span></td>
          </tr>
        </table>
      </div>
      <div class="py-2">
        <table class="mx-auto">
          <tr>
            <td class=""></td>
            <td class="text-right px-3">12%</td>
            <td class="text-right px-3">DPS</td>
            <td class="text-right px-3">20%</td>
            <td class="text-right px-3">DPS</td>
          </tr>
          <tr class="text-gray-100">
            <td class="">Physical</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">40</td>
            <td class="text-right px-3">50</td>
          </tr>
          <tr class="text-red-400">
            <td class="">Fire</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">-</td>
            <td class="text-right px-3">-</td>
          </tr>
          <tr class="text-yellow-400">
            <td class="">Lightning</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">-</td>
            <td class="text-right px-3">-</td>
          </tr>
          <tr class="text-blue-400">
            <td class="">Cold</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">-</td>
            <td class="text-right px-3">-</td>
          </tr>
          <tr class="text-gray-100">
            <td class="">Elemental</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">-</td>
            <td class="text-right px-3">-</td>
          </tr>
          <tr class="text-gray-100">
            <td class="">Total</td>
            <td class="text-right px-3">28</td>
            <td class="text-right px-3">30</td>
            <td class="text-right px-3">40</td>
            <td class="text-right px-3">50</td>
          </tr>
        </table>
      </div>
      <div class="py-2">
        <table class="mx-auto">
          <tr>
            <td class="">Armour</td>
            <td class="text-right px-3">28 (4%)</td>
            <td class="text-right px-3">50 (20%)</td>
          </tr>
          <tr>
            <td class="">Energy Shield</td>
            <td class="text-right px-3">28 (4%)</td>
            <td class="text-right px-3">40 (20%)</td>
          </tr>
          <tr>
            <td class="">Evasion rating</td>
            <td class="text-right px-3">28 (4%)</td>
            <td class="text-right px-3">30 (20%)</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedItem } from '@/parser'
import type { WidgetManager } from '../overlay/interfaces'

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true
    }
  },
  setup (props) {
    const wm = inject<WidgetManager>('wm')!
    const { t } = useI18n()

    return {
      t,
      maxWidth: computed(() => `min(${wm.size.value.width - wm.poePanelWidth.value}px, 30rem)`),
      itemName: computed(() => props.item.info.name)
    }
  }
})
</script>

<i18n>
{
  "ru": {
  }
}
</i18n>
