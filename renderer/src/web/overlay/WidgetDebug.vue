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

const ITEMS = {
  en: [
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
  ],
  zh_CN: [
`物品类别: 胸甲
稀 有 度: 稀有
精魂 保身
暗影之装
--------
品质: +28% (augmented)
闪避值: 1061 (augmented)
--------
需求:
等级: 68
敏捷: 183
--------
插槽: G-G-W-R-W-G 
--------
物品等级: 83
--------
{ 焚界者基底词缀（精美的） }
药剂每 3 秒获得 2 次使用机会 (implicit)
{ 灭界者基底词缀（顶级） — 光环 }
【怨毒光环】的光环效果提高 26(25-27)% (implicit)
--------
{ 前缀属性 "蓬勃的" (等阶：3) — 生命 }
+103(100-109) 最大生命
{ 前缀属性 "飞蛾的" (等阶：5) — 防御 }
闪避值提高 15(14-20)%
晕眩回复和格挡回复提高 9(8-9)%
{ 大师工艺前缀 "天选的" — 生命, 魔力 }
生命上限提高 8(5-8)% (crafted)
魔力上限提高 5(5-8)% (crafted)
{ 后缀属性 "放弃之" (等阶：2) }
法术伤害压制率 +19(17-19)% (fractured)
（若击中和异常状态被压制，则它们施加的伤害被阻挡 50%） (fractured)
{ 后缀属性 "精华之" — 魔力 }
技能的魔力保留效能提高 10(9-10)%
{ 后缀属性 "海象之" (等阶：4) — 元素, 冰霜, 抗性 }
+32(30-35)% 冰霜抗性
焚界者物品
灭界者物品
--------
分裂之物
--------
出售获得通货:非绑定
`,
`物品类别: 异界地图
稀 有 度: 稀有
曲空 绝壁
硫磺蚀岸
--------
地图阶级: 13
物品数量: +55% (augmented)
物品稀有度: +33% (augmented)
怪物群大小: +21% (augmented)
--------
物品等级: 81
--------
{ 前缀属性 "抗性的" (等阶：1) — 元素, 混沌, 抗性 }
+25% 怪物的混沌抗性
+40% 怪物的元素抗性
{ 前缀属性 "邪法免疫的" (等阶：1) — 施法, 诅咒 }
怪物免疫诅咒 — 数值不可估量
{ 前缀属性 "恶魔的" (等阶：1) }
区域内有许多【恶魔】 — 数值不可估量
{ 后缀属性 "迟钝之" (等阶：1) — 攻击 }
怪物的命中值提高 50%
玩家阻挡被压制的法术伤害量 -20%
（若击中和异常状态被压制，则它们施加的伤害被阻挡 50%）
--------
在私人地图装置中使用可以前往该地图。只能被使用一次。
--------
出售获得通货:非绑定
`,
`物品类别: 鞋子
稀 有 度: 稀有
种裔 疾影
巨灵胫甲
--------
护甲: 291 (augmented)
--------
需求:
等级: 54
力量: 95
--------
插槽: R R-R R 
--------
物品等级: 83
--------
{ 前缀属性 "甲壳的" (等阶：5) — 防御 }
该装备的护甲提高 45(43-55)%
{ 前缀属性 "海盗的" (等阶：1) }
物品稀有度提高 16(13-18)%
{ 前缀属性 "乐观的" (等阶：7) — 生命 }
+25(20-29) 最大生命
{ 后缀属性 "窑炉之" (等阶：5) — 元素, 火焰, 抗性 }
+24(24-29)% 火焰抗性
--------
出售获得通货:非绑定
`,
`物品类别: 项链
稀 有 度: 传奇
隐逝
黑曜护身符
--------
需求:
等级: 64
--------
物品等级: 87
--------
{ 基底属性 — 属性 }
+15(10-16) 全属性 (implicit)
(属性分为力量，敏捷和智慧三种) (implicit)
--------
{ 传奇属性 — 伤害, 混沌 }
附加 19(17-19) - 29(23-29) 基础混沌伤害
{ 传奇属性 — 生命 }
+61(50-70) 最大生命
{ 传奇属性 — 施法, 诅咒 }
绝望以光环形式施放时没有保留效果 — 数值不可估量
{ 传奇属性 — 伤害 }
持续伤害提高 33(30-40)%
{ 传奇属性 — 混沌, 抗性 }
+23(17-23)% 混沌抗性
{ 传奇属性 }
击败稀有或者传奇敌人时，获得【癫狂】状态 10 秒
(附近的敌人受到恶魔之触影响，减速10%并减少10%伤害)
{ 传奇属性 — 施法, 诅咒 }
作为光环效果施放的元素要害不具有保留效果 — 数值不可估量
--------
世界上最黑暗的虚空，就是忘记爱的痛苦……
--------
塑界之器
裂界之器
--------
出售获得通货:非绑定
`,
`物品类别: 符文匕首
稀 有 度: 稀有
凤鸣 剖刀
魔灵短匕
--------
符文匕首
品质: +20% (augmented)
物理伤害: 29-116 (augmented)
攻击暴击率: 6.50%
每秒攻击次数: 1.20
武器范围: 10
--------
需求:
等级: 68
敏捷: 76
智慧: 149 (unmet)
--------
插槽: G-G-G 
--------
物品等级: 90
--------
{ 基底属性 — 暴击 }
攻击和法术暴击率提高 40% (implicit)
--------
{ 前缀属性 "塑界者的" (等阶：3) — 伤害, 物理, 元素, 闪电 }
获得额外闪电伤害， 其数值等同于物理伤害的 8(7-12)%
{ 大师工艺前缀 "升级的" (等级：3) — 伤害, 混沌 }
混沌伤害提高 52(45-54)% (crafted)
{ 后缀属性 "裂界之" (等阶：1) — 宝石 }
此物品上的技能石受到 20 级的 先祖呼唤 辅助 — 数值不可估量
效果区域扩大 14(13-15)%
{ 后缀属性 "塑界之" (等阶：1) — 伤害, 混沌, 异常状态, 宝石 }
插入的技能石被 20 级的低阶毒化辅助 — 数值不可估量
中毒伤害提高 26(24-26)%
{ 后缀属性 "裂界之" (等阶：2) — 伤害, 攻击, 暴击, 宝石 }
此物品上的技能石受到 18 级的 提高暴击伤害 辅助 — 数值不可估量
+23(22-25)% 攻击和法术暴击伤害加成
--------
塑界之器
裂界之器
--------
出售获得通货:非绑定
`
  ]
}

export default defineComponent({
  components: { Widget },
  setup () {
    const wm = inject<WidgetManager>('wm')!

    function priceCheck (text: string) { /* eslint-disable no-console */
      MainProcess.selfDispatch({
        name: 'MAIN->OVERLAY::price-check',
        payload: { clipboard: text, position: { x: window.screenX + 100, y: window.screenY + 100 }, lockedMode: false }
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
        priceCheck(ITEMS.zh_CN[index])
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
