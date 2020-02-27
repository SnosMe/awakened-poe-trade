import { assertStat } from '../../trade/cleanup'
import { FiltersCreationContext } from '../../trade/interfaces'
import { percentRoll } from '../util'
import { ARMOUR } from '../../parser/meta'
import { pseudoStat } from './util'
import { filterResists } from './resistances'
import { filterAttributes } from './attributes'

export function filterPseudo (ctx: FiltersCreationContext) {
  filterResists(ctx)
  filterAttributes(ctx)
  filterRemainingPseudo(ctx)
}

function filterRemainingPseudo (ctx: FiltersCreationContext) {
  let pseudoMods = REST_PSEUDO

  if (ctx.item.category && ARMOUR.has(ctx.item.category)) {
    pseudoMods = pseudoMods.filter(p => p.if !== 'NOT_ARMOUR')
  }

  for (const pseudoMod of pseudoMods) {
    const total = ctx.modifiers.reduce((res, mod) => pseudoMod.stats.includes(mod.modInfo.text)
      ? (res || 0) + mod.values![0]
      : res, undefined as number | undefined)

    if (total !== undefined) {
      ctx.filters.push({
        ...pseudoMod.pseudo,
        roll: total,
        disabled: true,
        defaultMin: percentRoll(total, -10, Math.floor),
        defaultMax: percentRoll(total, +10, Math.ceil),
        min: percentRoll(total, -10, Math.floor),
        max: undefined
      })
    }
  }

  const statsToRemove = new Set(pseudoMods.flatMap(a => a.stats))
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.modInfo.text))
}

const REST_PSEUDO = [
  {
    pseudo: pseudoStat('+# total maximum Life'),
    stats: [
      assertStat('# to maximum Life')
    ]
  },
  {
    pseudo: pseudoStat('+# total maximum Mana'),
    stats: [
      assertStat('# to maximum Mana')
    ]
  },
  {
    pseudo: pseudoStat('#% total increased maximum Energy Shield'),
    if: 'NOT_ARMOUR',
    stats: [
      assertStat('#% increased maximum Energy Shield')
    ]
  },
  {
    pseudo: pseudoStat('+# total maximum Energy Shield'),
    if: 'NOT_ARMOUR',
    stats: [
      assertStat('# to maximum Energy Shield')
    ]
  }
]
