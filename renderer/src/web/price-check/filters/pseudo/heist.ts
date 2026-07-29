import { stat, pseudoStatByRef } from '@/assets/data'
import { ItemCategory, ItemRarity } from '@/parser'
import type { FiltersCreationContext } from '../create-stat-filters'
import { statToNotFilter } from './utils'
import { FilterTag } from '../interfaces'
import { ModifierType } from '@/parser/modifiers'

const PSEUDO = {
  ENCHANT_MODS: stat('# Enchant Modifiers')
}

export function applyHeistRules (ctx: FiltersCreationContext) {
  const applicable = ctx.item.category === ItemCategory.HeistBlueprint &&
    ctx.item.rarity !== ItemRarity.Unique &&
    !ctx.filters.some(filter => filter.tag === FilterTag.Enchant)
  if (!applicable) return

  const filter = statToNotFilter({
    stat: pseudoStatByRef(PSEUDO.ENCHANT_MODS)!,
    type: ModifierType.Pseudo,
    disabled: false
  })
  ctx.filters.push(filter)
}
