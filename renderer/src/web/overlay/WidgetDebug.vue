<template>
  <div v-if="show" class="widget-default-style p-1 text-gray-100 absolute left-4 bottom-4">
    <ui-toggle v-model="active" class="mb-1">Overlay active</ui-toggle>
    <div class="mb-1 flex gap-x-1">
      <button @click="pick(0)" class="btn">0</button>
      <button @click="pick(1)" class="btn">1</button>
      <button @click="pick(2)" class="btn">2</button>
      <button @click="pick(3)" class="btn">3</button>
      <button @click="pick(4)" class="btn">4</button>
    </div>
    <textarea class="px-2 py-1 bg-gray-700 rounded resize-none block" rows="1"
      placeholder="Price check (Ctrl+V)" @input="handleItemPaste"></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from 'vue'
import { WidgetManager } from './interfaces'
import Widget from './Widget.vue'
import { MainProcess } from '@/web/background/IPC'
import { parseClipboard } from '@/parser'

const ITEMS = [
`Item Class: Body Armours
Rarity: Rare
Kraken Suit
Crusader Plate
--------
Quality: +28% (augmented)
Armour: 871 (augmented)
--------
Requirements:
Level: 72
Str: 160
Dex: 100
Int: 114
--------
Sockets: R-G-G-R-B-R
--------
Item Level: 68
--------
{ Prefix Modifier "Athlete's" (Tier: 5) — Life }
+86(80-89) to maximum Life
{ Prefix Modifier "Thorny" (Tier: 4) — Damage, Physical }
Reflects 3(1-4) Physical Damage to Melee Attackers
{ Master Crafted Prefix Modifier "Chosen" — Life, Defences }
17(15-17)% increased Armour, Evasion and Energy Shield (crafted)
+15(15-16) to maximum Life (crafted)
{ Suffix Modifier "of the Underground" (Tier: 1) — Mana, Attack, Gem }
Socketed Attacks have -15 to Total Mana Cost — Unscalable Value
{ Suffix Modifier "of the Lion" (Tier: 6) — Attribute }
+23(23-27) to Strength
{ Suffix Modifier "of Dampening" (Tier: 2) — Physical }
2% additional Physical Damage Reduction
3(1-5)% increased Physical Damage taken
`,
`Item Class: Two Hand Swords
Rarity: Unique
Starforge
Infernal Sword
--------
Two Handed Sword
Quality: +30% (augmented)
Physical Damage: 387-805 (augmented)
Critical Strike Chance: 5.00%
Attacks per Second: 1.43 (augmented)
Weapon Range: 13
--------
Requirements:
Level: 70
Str: 155
Dex: 113
Int: 73
--------
Sockets: R-R-G R-B-R
--------
Item Level: 86
--------
{ Implicit Modifier — Attack }
30% increased Global Accuracy Rating (implicit)
--------
{ Unique Modifier — Attack }
20% increased Area of Effect for Attacks
{ Unique Modifier — Elemental, Lightning, Ailment }
Your Physical Damage can Shock — Unscalable Value
(Shock increases Damage taken by up to 50%, depending on the amount of Lightning Damage in the hit, for 2 seconds)
{ Unique Modifier — Damage, Elemental }
Deal no Elemental Damage — Unscalable Value
{ Unique Modifier — Damage, Physical, Attack }
494(200-300)% increased Physical Damage
{ Unique Modifier — Life }
+99(90-100) to maximum Life
{ Unique Modifier — Attack, Speed }
6(5-8)% increased Attack Speed
--------
The end is written into the beginning.
--------
Corrupted
--------
Shaper Item
`,
`Item Class: Helmets
Rarity: Rare
Bramble Visor
Runic Crest
--------
Ward: 220 (augmented)
--------
Requirements:
Level: 49
Str: 55
Dex: 55
Int: 55
--------
Sockets: B
--------
Item Level: 73
--------
{ Prefix Modifier "Coppersmith's" (Tier: 6) — Defences }
+23(16-23) to Ward
{ Prefix Modifier "Inscribed" (Tier: 3) — Defences }
79(68-79)% increased Ward
{ Prefix Modifier "Annest's" (Tier: 3) — Life, Defences }
+19(15-20) to Ward
+23(18-23) to maximum Life
{ Suffix Modifier "of the Tempest" (Tier: 4) — Elemental, Lightning, Resistance }
+32(30-35)% to Lightning Resistance
{ Suffix Modifier "of the Walrus" (Tier: 4) — Elemental, Cold, Resistance }
+34(30-35)% to Cold Resistance
--------
Note: ~price 10 chaos
`,
`Item Class: Rings
Rarity: Rare
Rapture Twirl
Ruby Ring
--------
Requirements:
Level: 28
--------
Item Level: 84
--------
{ Implicit Modifier — Elemental, Fire, Resistance }
+29(20-30)% to Fire Resistance (implicit)
--------
{ Prefix Modifier "Radiating" (Tier: 7) — Defences }
+18(16-19) to maximum Energy Shield
{ Prefix Modifier "Stalwart" (Tier: 5) — Life }
+33(30-39) to maximum Life
{ Suffix Modifier "of the Newt" (Tier: 7) — Life }
Regenerate 1.3(1-2) Life per second
{ Suffix Modifier "of the Kaleidoscope" (Tier: 3) — Elemental, Resistance }
+10(9-11)% to all Elemental Resistances
{ Suffix Modifier "of Riker's Veil" }
Veiled Suffix
`,
`Item Class: Misc Map Items
Rarity: Currency
Chronicle of Atzoatl
--------
Area Level: 71
--------
Open Rooms:
Lightning Workshop (Tier 1)
Guardhouse (Tier 1)
Poison Garden (Tier 1)
Treasury (Tier 2)
Jeweller's Workshop (Tier 1)
Trap Workshop (Tier 1)
Royal Meeting Room (Tier 1)
Sacrificial Chamber (Tier 1)
Omnitect Forge (Tier 2)
Museum of Artefacts (Tier 3)
Breach Containment Chamber (Tier 2)
Obstructed Rooms:
Apex of Atzoatl
--------
"Much could be learned from the relics said to be kept in Atzoatl. We consider the Vaal ancient, so what did they consider ancient in turn?" - Icius Perandus, Antiquities Collection, Vaal Mural
--------
Can be used in a personal Map Device to open portals to the Temple of Atzoatl in the present day.
`
]

export default defineComponent({
  components: { Widget },
  setup () {
    const wm = inject<WidgetManager>('wm')!

    function priceCheck (text: string) { /* eslint-disable no-console */
      MainProcess.selfDispatch({
        name: 'MAIN->CLIENT::item-text',
        payload: { clipboard: text, position: { x: 9999, y: 9999 }, focusOverlay: false, target: 'price-check' }
      })
      console.time('parsing item')
      const parsed = parseClipboard(text)
      console.timeEnd('parsing item')
      console.log(parsed)
    }

    return {
      show: computed(() => !MainProcess.isElectron),
      active: computed<boolean>({
        get () { return wm.active.value },
        set (value) { wm.active.value = value }
      }),
      pick (index: number) {
        priceCheck(ITEMS[index])
      },
      handleItemPaste (e: Event) {
        const target = e.target as HTMLInputElement
        priceCheck(target.value)
        target.value = ''
      }
    }
  }
})
</script>
