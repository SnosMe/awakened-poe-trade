import { pseudoStat, sumPseudoStats } from './util'
import { FiltersCreationContext } from '../create-stat-filters'
import { rollToFilter } from '../util'
import { stat } from '@/assets/data'
import { ModifierType } from '@/parser/modifiers'

const TO_ALL_RES = stat('+#% to all Elemental Resistances')

const ELEMENTAL_RES = [
  {
    pseudo: pseudoStat('+#% total to Fire Resistance'),
    stats: [
      stat('+#% to Fire Resistance'),
      stat('+#% to Fire and Lightning Resistances'),
      stat('+#% to Fire and Cold Resistances'),
      stat('+#% to Fire and Chaos Resistances'),
      TO_ALL_RES
    ]
  },
  {
    pseudo: pseudoStat('+#% total to Cold Resistance'),
    stats: [
      stat('+#% to Cold Resistance'),
      stat('+#% to Fire and Cold Resistances'),
      stat('+#% to Cold and Lightning Resistances'),
      stat('+#% to Cold and Chaos Resistances'),
      TO_ALL_RES
    ]
  },
  {
    pseudo: pseudoStat('+#% total to Lightning Resistance'),
    stats: [
      stat('+#% to Lightning Resistance'),
      stat('+#% to Fire and Lightning Resistances'),
      stat('+#% to Cold and Lightning Resistances'),
      stat('+#% to Lightning and Chaos Resistances'),
      TO_ALL_RES
    ]
  }
]

const CHAOS_RES = {
  pseudo: pseudoStat('+#% total to Chaos Resistance'),
  stats: [
    stat('+#% to Chaos Resistance'),
    stat('+#% to Fire and Chaos Resistances'),
    stat('+#% to Cold and Chaos Resistances'),
    stat('+#% to Lightning and Chaos Resistances')
  ]
}

export function filterResists (ctx: FiltersCreationContext) {
  const resists: Array<{ pseudo: ReturnType<typeof pseudoStat>, total: number, hasFlat: boolean }> = []

  for (const eleRes of ELEMENTAL_RES) {
    const hasFlat = ctx.modifiers.some(m =>
      eleRes.stats.includes(m.stat.ref) && m.stat.ref !== TO_ALL_RES)

    const total = sumPseudoStats(ctx.modifiers, eleRes.stats)
    if (total !== undefined) {
      resists.push({ pseudo: eleRes.pseudo, total, hasFlat })
    }
  }

  const totalRes = resists.reduce((a, b) => a + b.total, 0)

  if (resists.length > 0) {
    ctx.filters.push({
      ...pseudoStat('+#% total Elemental Resistance'),
      disabled: (resists.length === 1),
      ...rollToFilter(totalRes, { neverNegated: true })
    })

    const maxRes = Math.max(...resists.map(r => r.total))

    if ((maxRes / totalRes > 0.67) || resists.filter(r => r.hasFlat).length === 1) {
      ctx.filters.push({
        text: '+#% total to one of Elemental Resistances',
        statRef: '+#% total to one of Elemental Resistances',
        tradeId: ELEMENTAL_RES.flatMap(r => r.pseudo.tradeId),
        type: 'pseudo',
        disabled: false,
        ...rollToFilter(maxRes, { neverNegated: true })
      })
    }
  }

  if (resists.length === 3) {
    const totalToAllRes = Math.min(...resists.map(r => r.total))

    if ((totalToAllRes * resists.length) / totalRes > 0.8) {
      ctx.filters.push({
        ...pseudoStat('+#% total to all Elemental Resistances'),
        disabled: false,
        ...rollToFilter(totalToAllRes, { neverNegated: true })
      })
    }
  }

  for (const resist of resists) {
    ctx.filters.push({
      ...resist.pseudo,
      disabled: true,
      hidden: 'Filtering by exact Elemental Resistance unreasonably increases the price',
      ...rollToFilter(resist.total, { neverNegated: true })
    })
  }

  const chaosTotal = sumPseudoStats(ctx.modifiers, CHAOS_RES.stats)
  if (chaosTotal != null) {
    const hasNotCrafted = ctx.modifiers.some(mod =>
      mod.type !== ModifierType.Crafted &&
      CHAOS_RES.stats.includes(mod.stat.ref))

    ctx.filters.push({
      ...CHAOS_RES.pseudo,
      disabled: true, // NOTE: unlike EleRes it is disabled
      hidden: hasNotCrafted ? undefined : 'Crafted Chaos Resistance without Explicit mod has no value',
      ...rollToFilter(chaosTotal, { neverNegated: true })
    })
  }

  const statsToRemove = new Set([...ELEMENTAL_RES.flatMap(r => r.stats), ...CHAOS_RES.stats])
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.stat.ref))
}
