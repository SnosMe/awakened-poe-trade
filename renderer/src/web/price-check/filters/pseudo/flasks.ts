import { stat } from '@/assets/data'
import { ItemRarity } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import type { FiltersCreationContext } from '../create-stat-filters'
import { findAndResolveByRef, statToNotFilter } from './utils'

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

  const effectStat = findAndResolveByRef(STATS.INCR_EFFECT, ModifierType.Explicit, ctx.item.category)
  const filter = statToNotFilter({
    stat: effectStat,
    type: ModifierType.Explicit,
    negateString: true,
    disabled: false
  })
  const insertAfter = ctx.filters.findIndex(filter => filter.statRef === STATS.INCR_CHARGE_RECOVERY)
  ctx.filters.splice(insertAfter + 1, 0, filter)
}
