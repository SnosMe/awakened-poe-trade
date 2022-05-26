import { StatFilter } from './interfaces'
import { BLIGHT_RECIPES, ITEM_BY_REF } from '@/assets/data'

export function createAnointmentComposition (filter: StatFilter) {
  if (filter.tag !== 'enchant') return null

  const category = filter.statRef === 'Allocates #' ? 'passive' : 'tower'

  const value = category === 'passive' ? filter.option!.value : parseInt(filter.tradeId[0].split('_')[1])
  if (!value) return null

  const oils = (BLIGHT_RECIPES.recipes[category][value] ?? [])
    .map(idx => BLIGHT_RECIPES.oils[idx])
    .map(oilName => ITEM_BY_REF('ITEM', oilName)?.[0])
  if (!oils.length) return null

  return oils
}
