import { stat, pseudoStatByRef } from '@/assets/data'
import { ItemCategory, ItemRarity } from '@/parser'
import type { FiltersCreationContext } from '../create-stat-filters'
import { statToNotFilter } from './utils'
import { propToFilter } from './item-property'
import { FilterTag, InternalTradeId } from '../interfaces'
import { ModifierType } from '@/parser/modifiers'

const PSEUDO = {
  ENCHANT_MODS: stat('# Enchant Modifiers')
}

export function applyHeistRules (ctx: FiltersCreationContext) {
  applyContractRules(ctx)
  applyBlueprintRules(ctx)
}

function applyContractRules (ctx: FiltersCreationContext) {
  if (ctx.item.category !== ItemCategory.HeistContract || ctx.item.rarity === ItemRarity.Unique) return

  const { item } = ctx
  if (item.heistContract?.requiredJob && item.heistContract.jobLevel) {
    let internalId: InternalTradeId
    switch (item.heistContract.requiredJob) {
      case 'Lockpicking':
        internalId = 'item.heist_job_lockpicking'; break
      case 'Brute Force':
        internalId = 'item.heist_job_bruteforce'; break
      case 'Perception':
        internalId = 'item.heist_job_perception'; break
      case 'Demolition':
        internalId = 'item.heist_job_demolition'; break
      case 'Counter-Thaumaturgy':
        internalId = 'item.heist_job_counterthaumaturgy'; break
      case 'Trap Disarmament':
        internalId = 'item.heist_job_trapdisarmament'; break
      case 'Agility':
        internalId = 'item.heist_job_agility'; break
      case 'Deception':
        internalId = 'item.heist_job_deception'; break
      case 'Engineering':
        internalId = 'item.heist_job_engineering'; break
    }

    ctx.filters.push(propToFilter({
      ref: internalId,
      tradeId: internalId,
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.heistContract.jobLevel },
      sources: [],
      disabled: false
    }, { ...ctx, searchInRange: 0 }))
  }

  if (item.heistContract?.targetValue === 'Priceless') {
    ctx.filters.push(propToFilter({
      ref: 'Heist Target: Priceless',
      tradeId: 'item.heist_target_priceless',
      roll: undefined,
      sources: [],
      disabled: false
    }, ctx))
  }
}

function applyBlueprintRules (ctx: FiltersCreationContext) {
  if (ctx.item.category !== ItemCategory.HeistBlueprint || ctx.item.rarity === ItemRarity.Unique) return

  if (!ctx.filters.some(filter => filter.tag === FilterTag.Enchant)) {
    const filter = statToNotFilter({
      stat: pseudoStatByRef(PSEUDO.ENCHANT_MODS)!,
      type: ModifierType.Pseudo,
      disabled: false
    })
    ctx.filters.push(filter)
  }

  const { item } = ctx
  ctx.filters.push(propToFilter({
    ref: 'Wings Revealed: #',
    tradeId: 'item.heist_wings_revealed',
    roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.heistBlueprint!.wingsRevealed! },
    sources: [],
    disabled: false
  }, { ...ctx, searchInRange: 0 }))

  ctx.filters.push(propToFilter({
    ref: 'Total Wings: #',
    tradeId: 'item.heist_wings_total',
    roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.heistBlueprint!.wingsTotal! },
    sources: [],
    disabled: false
  }, { ...ctx, searchInRange: 0 }))
}
