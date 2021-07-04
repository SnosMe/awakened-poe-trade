import { FiltersCreationContext } from '../create-stat-filters'
import { rollToFilter } from '../util'
import { pseudoStat, sumPseudoStats } from './util'
import { filterResists } from './resistances'
import { filterAttributes } from './attributes'
import { stat, STAT_BY_REF } from '@/assets/data'

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
        ...rollToFilter(total, {
          neverNegated: true,
          dp: pseudoMod.stats.some((ref) => STAT_BY_REF.get(ref)!.stat.dp)
        })
      })
    }
  }

  const statsToRemove = new Set(REST_PSEUDO.flatMap(a => a.stats))
  ctx.modifiers = ctx.modifiers.filter(m => !statsToRemove.has(m.stat.ref))
}

const REST_PSEUDO = [
  {
    pseudo: pseudoStat('+# total maximum Life'),
    stats: [
      stat('+# to maximum Life')
    ]
  },
  {
    pseudo: pseudoStat('+# total maximum Mana'),
    stats: [
      stat('+# to maximum Mana')
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
      stat('+# to maximum Energy Shield') // global
    ]
  },
  {
    pseudo: pseudoStat('+#% total Attack Speed'),
    stats: [
      stat('#% increased Attack Speed') // global
      // stat('#% increased Attack and Cast Speed')
    ]
  },
  {
    pseudo: pseudoStat('+#% total Cast Speed'),
    stats: [
      stat('#% increased Cast Speed')
      // stat('#% increased Attack and Cast Speed')
    ]
  },
  {
    pseudo: pseudoStat('#% total increased Physical Damage'),
    stats: [
      stat('#% increased Physical Damage')
    ]
  },
  {
    pseudo: pseudoStat('+#% total Critical Strike Chance for Spells'),
    stats: [
      stat('#% increased Critical Strike Chance for Spells'),
      stat('#% increased Global Critical Strike Chance')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Movement Speed'),
    stats: [
      stat('#% increased Movement Speed')
    ]
  },
  {
    pseudo: pseudoStat('+#% Global Critical Strike Chance'),
    stats: [
      stat('#% increased Global Critical Strike Chance')
    ]
  },
  {
    pseudo: pseudoStat('+#% Global Critical Strike Multiplier'),
    stats: [
      stat('+#% to Global Critical Strike Multiplier')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Lightning Damage'),
    stats: [
      stat('#% increased Lightning Damage'),
      stat('#% increased Elemental Damage')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Cold Damage'),
    stats: [
      stat('#% increased Cold Damage'),
      stat('#% increased Elemental Damage')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Fire Damage'),
    stats: [
      stat('#% increased Fire Damage'),
      stat('#% increased Elemental Damage')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Elemental Damage with Attack Skills'),
    stats: [
      stat('#% increased Elemental Damage with Attack Skills')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Spell Damage'),
    stats: [
      stat('#% increased Spell Damage')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Burning Damage'),
    stats: [
      stat('#% increased Burning Damage')
    ]
  },
  {
    pseudo: pseudoStat('# Life Regenerated per Second'),
    stats: [
      stat('Regenerate # Life per second')
    ]
  },
  {
    pseudo: pseudoStat('#% of Life Regenerated per Second'),
    stats: [
      stat('Regenerate #% of Life per second')
    ]
  },
  {
    pseudo: pseudoStat('#% of Physical Attack Damage Leeched as Life'),
    stats: [
      stat('#% of Physical Attack Damage Leeched as Life')
    ]
  },
  {
    pseudo: pseudoStat('#% of Physical Attack Damage Leeched as Mana'),
    stats: [
      stat('#% of Physical Attack Damage Leeched as Mana')
    ]
  },
  {
    pseudo: pseudoStat('#% increased Mana Regeneration Rate'),
    stats: [
      stat('#% increased Mana Regeneration Rate')
    ]
  }
]
