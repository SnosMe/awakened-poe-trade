<template>
  <widget v-if="show"
    :config="config" :removable="false" readonly :hideable="false">
    <div class="widget-default-style p-1 text-gray-100">
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
  </widget>
</template>

<script lang="ts">
import { defineComponent, inject, reactive, computed } from 'vue'
import { WidgetManager, Anchor } from './interfaces'
import Widget from './Widget.vue'
import { MainProcess } from '@/ipc/main-process-bindings'
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
`Item Class: Jewels
Rarity: Rare
Pandemonium Ember
Crimson Jewel
--------
Item Level: 25
--------
{ Corruption Implicit Modifier — Damage, Minion }
Minions deal 5(4-5)% increased Damage (implicit)
--------
{ Prefix Modifier "Vicious" (Tier: 1) — Damage, Attack }
20% increased Fire Damage
{ Suffix Modifier "of Combat" (Tier: 1) — Damage, Attack }
8% increased Elemental Damage
{ Suffix Modifier "of Bleeding" (Tier: 1) — Physical, Attack, Ailment }
Attacks have 5(3-5)% chance to cause Bleeding
(Bleeding deals Physical Damage over time, based on the base Physical Damage of the Skill. Damage is higher while moving)
16(12-16)% increased Bleeding Duration
--------
Place into an allocated Jewel Socket on the Passive Skill Tree. Right click to remove from the Socket.
--------
Corrupted
--------
Note: ~price 3 chaos
`,
`Item Class: Amulets
Rarity: Rare
Blood Heart
Breakrib Talisman
--------
Requirements:
Level: 54
--------
Item Level: 72
--------
Talisman Tier: 1
--------
Adds 45 to 68 Fire Damage if you've Killed Recently (enchant)
Allocates Mind Drinker (enchant)
--------
{ Implicit Modifier — Damage, Physical }
25(20-30)% increased Global Physical Damage (implicit)
--------
{ Prefix Modifier "Incandescent" (Tier: 3) — Defences }
+42(38-43) to maximum Energy Shield
{ Prefix Modifier "Blurred" (Tier: 3) — Defences }
16(14-16)% increased Evasion Rating
{ Suffix Modifier "of the Marksman" (Tier: 2) — Attack }
+289(251-350) to Accuracy Rating
{ Suffix Modifier "of the Maelstrom" (Tier: 3) — Elemental, Lightning, Resistance }
+41(36-41)% to Lightning Resistance
{ Suffix Modifier "of the Kaleidoscope" (Tier: 4) — Elemental, Resistance }
+11(9-11)% to all Elemental Resistances
--------
I stood among the stones
And called out to the First Ones;
That with tooth and mighty claw,
They should tear our enemies asunder.
- The Wolven King
--------
Corrupted
`
]

export default defineComponent({
  components: { Widget },
  setup () {
    const wm = inject<WidgetManager>('wm')!

    const config = reactive({
      anchor: { pos: 'bl', x: 1, y: 98.5 } as Anchor
    })

    function priceCheck (text: string) {
      MainProcess.selfEmitPriceCheck({ clipboard: text, position: { x: window.screenX + 100, y: window.screenY + 100 }, lockedMode: false })
      // eslint-disable-next-line no-console
      console.time('parsing item')
      const parsed = parseClipboard(text)
      console.timeEnd('parsing item')
      console.log(parsed)
    }

    return {
      config,
      show: computed(() => {
        return !MainProcess.isElectron
      }),
      active: computed<boolean>({
        get () { return wm.active },
        set (value) { wm.active = value }
      }),
      pick (index: number) {
        priceCheck(ITEMS[index])
      },
      handleItemPaste (e: InputEvent) {
        const target = e.target as HTMLInputElement
        priceCheck(target.value)
        target.value = ''
      }
    }
  }
})
</script>
