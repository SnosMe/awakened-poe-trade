import { stat, STAT_BY_REF_V2 } from '@/assets/data'
import { ItemRarity } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import type { FiltersCreationContext } from '../create-stat-filters'
import { StatFilter, FilterTag } from '../interfaces'

const STATS = {
  INCR_CHARGE_RECOVERY: stat('#% increased Charge Recovery'),
  INCR_EFFECT: stat('#% increased effect')
}

// https://github.com/SnosMe/awakened-poe-trade/issues/758
export function applyFlaskHybridMod (ctx: FiltersCreationContext) {
  const applicable = ctx.item.rarity === ItemRarity.Magic &&
    ctx.filters.some(filter => filter.statRef === STATS.INCR_CHARGE_RECOVERY) &&
    !ctx.filters.some(filter => filter.statRef === STATS.INCR_EFFECT)
  if (!applicable) return

  const statGroup = STAT_BY_REF_V2(STATS.INCR_EFFECT)!
  if (!('stats' in statGroup && statGroup.resolve.strat === 'select')) {
    throw new Error(`Unexpected stat shape: ${STATS.INCR_EFFECT}`)
  }
  const effectStat = statGroup.stats[statGroup.resolve.test.indexOf(null)]

  const filter: StatFilter = {
    tradeId: effectStat.trade.ids[ModifierType.Explicit],
    statRef: effectStat.ref,
    text: effectStat.matchers.find(matcher => matcher.negate)!.string,
    tag: FilterTag.Explicit,
    sources: [],
    disabled: false,
    not: true
  }
  const insertAfter = ctx.filters.findIndex(filter => filter.statRef === STATS.INCR_CHARGE_RECOVERY)
  ctx.filters.splice(insertAfter + 1, 0, filter)
}
