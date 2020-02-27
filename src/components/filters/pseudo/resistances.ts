import { assertStat } from '../../trade/cleanup'
import { pseudoStat } from './util'
import { FiltersCreationContext } from '../../trade/interfaces'
import { percentRoll } from '../util'

const TO_ALL_RES = assertStat('#% to all Elemental Resistances')

const ELEMENTAL_RES = [
  {
    pseudo: pseudoStat('+#% total to Fire Resistance'),
    stats: [
      assertStat('#% to Fire Resistance'),
      assertStat('#% to Fire and Lightning Resistances'),
      assertStat('#% to Fire and Cold Resistances'),
      assertStat('#% to Fire and Chaos Resistances'),
      TO_ALL_RES
    ]
  },
  {
    pseudo: pseudoStat('+#% total to Cold Resistance'),
    stats: [
      assertStat('#% to Cold Resistance'),
      assertStat('#% to Fire and Cold Resistances'),
      assertStat('#% to Cold and Lightning Resistances'),
      assertStat('#% to Cold and Chaos Resistances'),
      TO_ALL_RES
    ]
  },
  {
    pseudo: pseudoStat('+#% total to Lightning Resistance'),
    stats: [
      assertStat('#% to Lightning Resistance'),
      assertStat('#% to Fire and Lightning Resistances'),
      assertStat('#% to Cold and Lightning Resistances'),
      assertStat('#% to Lightning and Chaos Resistances'),
      TO_ALL_RES
    ]
  }
]

const CHAOS_RES = {
  pseudo: pseudoStat('+#% total to Chaos Resistance'),
  base: assertStat('#% to Chaos Resistance'),
  stats: [
    assertStat('#% to Chaos Resistance'),
    assertStat('#% to Fire and Chaos Resistances'),
    assertStat('#% to Cold and Chaos Resistances'),
    assertStat('#% to Lightning and Chaos Resistances')
  ]
}

export function filterResists (ctx: FiltersCreationContext) {
  const resists: Array<{ pseudo: ReturnType<typeof pseudoStat>, total: number, hasFlat: boolean }> = []

  for (const eleRes of ELEMENTAL_RES) {
    const hasFlat = ctx.modifiers.some(m =>
      eleRes.stats.includes(m.modInfo.text) && m.modInfo.text !== TO_ALL_RES)

    const total = ctx.modifiers.reduce((res, mod) => eleRes.stats.includes(mod.modInfo.text)
      ? (res || 0) + mod.values![0]
      : res, undefined as number | undefined)

    if (total !== undefined) {
      resists.push({ pseudo: eleRes.pseudo, total, hasFlat })
    }
  }

  const totalRes = resists.reduce((a, b) => a + b.total, 0)

  if (resists.length > 1) {
    ctx.filters.push({
      ...pseudoStat('+#% total Elemental Resistance'),
      roll: totalRes,
      disabled: false,
      defaultMin: percentRoll(totalRes, -10, Math.floor),
      defaultMax: percentRoll(totalRes, +10, Math.ceil),
      min: percentRoll(totalRes, -10, Math.floor),
      max: undefined
    })
  }

  if (resists.length > 0) {
    const maxRes = Math.max(...resists.map(r => r.total))

    if ((maxRes / totalRes > 0.67) || resists.filter(r => r.hasFlat).length === 1) {
      ctx.filters.push({
        text: '+#% total to one of Elemental Resistances',
        tradeId: ELEMENTAL_RES.map(r => r.pseudo.tradeId),
        type: 'pseudo',
        roll: maxRes,
        disabled: false,
        defaultMin: percentRoll(maxRes, -10, Math.floor),
        defaultMax: percentRoll(maxRes, +10, Math.ceil),
        min: percentRoll(maxRes, -10, Math.floor),
        max: undefined
      })
    }
  }

  if (resists.length === 3) {
    const totalToAllRes = Math.min(...resists.map(r => r.total))

    if ((totalToAllRes * resists.length) / totalRes > 0.8) {
      ctx.filters.push({
        ...pseudoStat('+#% total to all Elemental Resistances'),
        roll: totalToAllRes,
        disabled: false,
        defaultMin: percentRoll(totalToAllRes, -10, Math.floor),
        defaultMax: percentRoll(totalToAllRes, +10, Math.ceil),
        min: percentRoll(totalToAllRes, -10, Math.floor),
        max: undefined
      })
    }
  }

  for (const resist of resists) {
    ctx.filters.push({
      ...resist.pseudo,
      roll: resist.total,
      disabled: true,
      hidden: 'Filtering by exact Elemental Resistance unreasonably increases the price',
      defaultMin: percentRoll(resist.total, -10, Math.floor),
      defaultMax: percentRoll(resist.total, +10, Math.ceil),
      min: percentRoll(resist.total, -10, Math.floor),
      max: undefined
    })
  }

  const hasBaseChaosRes = ctx.modifiers.some(m => m.modInfo.text === CHAOS_RES.base)
  if (hasBaseChaosRes) {
    const chaosTotal = ctx.modifiers.reduce((res, mod) =>
      CHAOS_RES.stats.includes(mod.modInfo.text) ? res + mod.values![0] : res, 0)

    ctx.filters.push({
      ...CHAOS_RES.pseudo,
      roll: chaosTotal,
      disabled: true, // NOTE: unlike EleRes it is disabled
      defaultMin: percentRoll(chaosTotal, -10, Math.floor),
      defaultMax: percentRoll(chaosTotal, +10, Math.ceil),
      min: percentRoll(chaosTotal, -10, Math.floor),
      max: undefined
    })
  }

  const statsToRemove = new Set([...ELEMENTAL_RES.flatMap(r => r.stats), ...CHAOS_RES.stats])
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.modInfo.text))
}
