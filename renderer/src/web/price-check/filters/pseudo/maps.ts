import { stat, pseudoStatByRef } from '@/assets/data'
import { ItemRarity } from '@/parser/ParsedItem'
import { FiltersCreationContext } from '../create-stat-filters'
import { noSourcePseudoToFilter, propToFilter } from './item-property'

const PSEUDO = {
  MORE_SCARABS: stat('More Scarabs: #%'),
  MORE_MAPS: stat('More Maps: #%'),
  MORE_DIVINATION_CARDS: stat('More Divination Cards: #%'),
  MORE_CURRENCY: stat('More Currency: #%'),
  EXPLICIT_MODIFIERS: stat('# Modifiers')
}

export function mapProps (ctx: FiltersCreationContext): void {
  const { item } = ctx
  if (!item.map || item.mapBlighted || item.mapCompletionReward || item.rarity === ItemRarity.Unique) return

  const hasMoreDrops = Boolean(item.map.moreMaps || item.map.moreScarabs || item.map.moreCurrency || item.map.moreDivCards)

  if (!item.isCorrupted && !hasMoreDrops && item.map.tier !== 17) return

  if (item.map.itemQuantity) {
    ctx.filters.push(propToFilter({
      ref: 'Item Quantity: +#%',
      tradeId: 'item.map_item_quantity',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.itemQuantity },
      sources: [],
      disabled: false
    }, ctx))
  }
  if (item.map.itemRarity) {
    ctx.filters.push(propToFilter({
      ref: 'Item Rarity: +#%',
      tradeId: 'item.map_item_rarity',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.itemRarity },
      sources: [],
      disabled: hasMoreDrops
    }, ctx))
  }
  if (item.map.packSize) {
    ctx.filters.push(propToFilter({
      ref: 'Monster Pack Size: +#%',
      tradeId: 'item.map_pack_size',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.packSize },
      sources: [],
      disabled: false
    }, ctx))
  }

  if (item.map.moreMaps) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.MORE_MAPS)!,
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.moreMaps },
      disabled: false
    }, ctx))
  }
  if (item.map.moreScarabs) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.MORE_SCARABS)!,
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.moreScarabs },
      disabled: false
    }, ctx))
  }
  if (item.map.moreCurrency) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.MORE_CURRENCY)!,
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.moreCurrency },
      disabled: false
    }, ctx))
  }
  if (item.map.moreDivCards) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.MORE_DIVINATION_CARDS)!,
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.map.moreDivCards },
      disabled: false
    }, ctx))
  }

  const explicitMods = item.newMods.filter(mod => mod.info.generation === 'prefix' || mod.info.generation === 'suffix')
  if (explicitMods.length === 8 && !hasMoreDrops) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.EXPLICIT_MODIFIERS)!,
      roll: { min: 0, max: 8, value: explicitMods.length },
      disabled: false
    }, { ...ctx, searchInRange: 0 }))
  }
}
