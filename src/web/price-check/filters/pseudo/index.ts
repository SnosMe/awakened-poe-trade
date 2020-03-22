import { FiltersCreationContext } from '../create-stat-filters'
import { rollToFilter } from '../util'
import { pseudoStat, sumPseudoStats } from './util'
import { filterResists } from './resistances'
import { filterAttributes } from './attributes'
import { stat } from '@/assets/data'

export function filterPseudo (ctx: FiltersCreationContext) {
  filterResists(ctx)
  filterAttributes(ctx)
  filterRemainingPseudo(ctx)
}

function filterRemainingPseudo (ctx: FiltersCreationContext) {
  for (const pseudoMod of REST_PSEUDO) {
    const total = sumPseudoStats(ctx.modifiers, pseudoMod.stats)

    if (total !== undefined) {
      ctx.filters.push({
        ...pseudoMod.pseudo,
        disabled: true,
        ...rollToFilter(total)
      })
    }
  }

  const statsToRemove = new Set(REST_PSEUDO.flatMap(a => a.stats))
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.modInfo.text))
}

const REST_PSEUDO = [
  {
    pseudo: pseudoStat('+# total maximum Life'),
    stats: [
      stat('# to maximum Life')
    ]
  },
  {
    pseudo: pseudoStat('+# total maximum Mana'),
    stats: [
      stat('# to maximum Mana')
    ]
  },
  {
    pseudo: pseudoStat('#% total increased maximum Energy Shield'),
    stats: [
      stat('#% increased maximum Energy Shield')
    ]
  },
  {
    pseudo: pseudoStat('+# total maximum Energy Shield'),
    stats: [
      stat('# to maximum Energy Shield')
    ]
  }
]
