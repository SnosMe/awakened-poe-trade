import { ParsedItem, ItemRarity, ItemCategory } from '@/parser'
import { FilterTag, StatFilter } from '../interfaces'
import { ModifierType } from '@/parser/modifiers'
import { pseudoStatByRef } from '@/assets/data'

export function applyRules (item: ParsedItem, filters: StatFilter[]) {
  if (
    item.rarity !== ItemRarity.Unique ||
    item.category !== ItemCategory.Jewel ||
    item.info.refName !== 'The Light of Meaning' ||
    item.info.unique?.base !== 'Prismatic Jewel'
  ) return

  const text = item.rawText
  const refs = [
    'Passive Skills in Radius also grant #% increased Armour',
    'Passive Skills in Radius also grant #% increased Chaos Damage',
    'Passive Skills in Radius also grant #% increased Cold Damage',
    'Passive Skills in Radius also grant #% increased Energy Shield',
    'Passive Skills in Radius also grant #% increased Evasion Rating',
    'Passive Skills in Radius also grant #% increased Fire Damage',
    'Passive Skills in Radius also grant #% increased Global Critical Strike Chance',
    'Passive Skills in Radius also grant #% increased Lightning Damage',
    'Passive Skills in Radius also grant #% increased Physical Damage',
    'Passive Skills in Radius also grant +#% to Chaos Resistance',
    'Passive Skills in Radius also grant +# to all Attributes',
    'Passive Skills in Radius also grant +# to maximum Life',
    'Passive Skills in Radius also grant +# to maximum Mana'
  ]
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const ref of refs) {
    const dbStat = pseudoStatByRef(ref)
    if (!dbStat) continue
    let matched: { value: number, text: string } | null = null
    for (const mstr of dbStat.matchers) {
      const re = new RegExp(esc(mstr.string).replace(/#/g, '(\\d+(?:\\.\\d+)?)'), 'm')
      const m = text.match(re)
      if (!m) continue
      const value = Number(m[1])
      const outText = mstr.string.replace(/#/g, String(value))
      matched = { value, text: outText }
      break
    }
    if (!matched) continue
    const tradeId = dbStat.trade.ids[ModifierType.Explicit][0]
    filters.push({
      tradeId: [tradeId],
      statRef: dbStat.ref,
      text: matched.text,
      tag: FilterTag.Explicit,
      oils: undefined,
      sources: [],
      roll: {
        value: matched.value,
        min: matched.value,
        max: matched.value,
        default: { min: matched.value, max: matched.value },
        bounds: { min: matched.value, max: matched.value },
        tradeInvert: false,
        dp: false,
        isNegated: false
      },
      disabled: false
    })
  }
}
