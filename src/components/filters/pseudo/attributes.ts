import { assertStat } from '../../trade/cleanup'
import { pseudoStat, sumPseudoStats } from './util'
import { FiltersCreationContext } from '../../trade/interfaces'
import { percentRoll } from '../util'
import { STAT_BY_TEXT } from '../../../data'
import { ModifierType } from '../../parser/modifiers'

const TO_ALL_ATTRS = assertStat('# to all Attributes')

const STR_ATTR = {
  pseudo: pseudoStat('+# total to Strength'),
  stats: [
    assertStat('# to Strength'),
    assertStat('# to Strength and Intelligence'),
    assertStat('# to Strength and Dexterity'),
    TO_ALL_ATTRS
  ]
}

const DEX_ATTR = {
  pseudo: pseudoStat('+# total to Dexterity'),
  stats: [
    assertStat('# to Dexterity'),
    assertStat('# to Dexterity and Intelligence'),
    assertStat('# to Strength and Dexterity'),
    TO_ALL_ATTRS
  ]
}

const INT_ATTR = {
  pseudo: pseudoStat('+# total to Intelligence'),
  stats: [
    assertStat('# to Intelligence'),
    assertStat('# to Strength and Intelligence'),
    assertStat('# to Dexterity and Intelligence'),
    TO_ALL_ATTRS
  ]
}

const ATTRS = [
  STR_ATTR,
  DEX_ATTR,
  INT_ATTR
]

const TO_MAXIMUM_LIFE = assertStat('# to maximum Life')
const TO_MAXIMUM_MANA = assertStat('# to maximum Mana')

export function filterAttributes (ctx: FiltersCreationContext) {
  const attrs: Array<{ pseudo: ReturnType<typeof pseudoStat>, total: number, hasFlat: boolean }> = []

  for (const attr of ATTRS) {
    const hasFlat = ctx.modifiers.some(m =>
      attr.stats.includes(m.modInfo.text) && m.modInfo.text !== TO_ALL_ATTRS)

    const total = sumPseudoStats(ctx.modifiers, attr.stats)
    if (total !== undefined) {
      attrs.push({ pseudo: attr.pseudo, total, hasFlat })
    }
  }

  for (const attr of attrs) {
    if (!attr.hasFlat) continue

    ctx.filters.push({
      ...attr.pseudo,
      roll: attr.total,
      disabled: true,
      defaultMin: percentRoll(attr.total, -10, Math.floor),
      defaultMax: percentRoll(attr.total, +10, Math.ceil),
      min: percentRoll(attr.total, -10, Math.floor),
      max: undefined
    })
  }

  const isOnlyToTotal = (attrs.length && attrs.every(a => !a.hasFlat))
  if (isOnlyToTotal) {
    const totalToAllAttrs = sumPseudoStats(ctx.modifiers, [TO_ALL_ATTRS])!

    ctx.filters.push({
      ...pseudoStat('+# total to all Attributes'),
      roll: totalToAllAttrs,
      disabled: true,
      defaultMin: percentRoll(totalToAllAttrs, -10, Math.floor),
      defaultMax: percentRoll(totalToAllAttrs, +10, Math.ceil),
      min: percentRoll(totalToAllAttrs, -10, Math.floor),
      max: undefined
    })
  }

  for (const attr of attrs) {
    if (attr.pseudo.text === STR_ATTR.pseudo.text) {
      ctx.modifiers.push({
        modInfo: STAT_BY_TEXT.get(TO_MAXIMUM_LIFE)!,
        type: ModifierType.Explicit,
        values: [Math.floor(attr.total * (5 / 10))]
      })
    }
    if (attr.pseudo.text === INT_ATTR.pseudo.text) {
      ctx.modifiers.push({
        modInfo: STAT_BY_TEXT.get(TO_MAXIMUM_MANA)!,
        type: ModifierType.Explicit,
        values: [Math.floor(attr.total * (5 / 10))]
      })
    }
  }

  const statsToRemove = new Set(ATTRS.flatMap(a => a.stats))
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.modInfo.text))
}
