import { stat, pseudoStatByRef } from '@/assets/data'
import { ItemRarity, ItemCategory } from '@/parser'
import { ModifierType } from '@/parser/modifiers'
import { FiltersCreationContext } from '../create-stat-filters'
import { noSourcePseudoToFilter, propToFilter } from './item-property'
import { findAndResolveByRef, statToNotFilter } from './utils'

const PSEUDO = {
  MORE_SCARABS: stat('More Scarabs: #%'),
  MORE_MAPS: stat('More Maps: #%'),
  MORE_DIVINATION_CARDS: stat('More Divination Cards: #%'),
  MORE_CURRENCY: stat('More Currency: #%'),
  EXPLICIT_MODIFIERS: stat('# Modifiers')
}

const VALDO_LETHAL_STATS = [
  stat('Players who Die in area are sent to the Void')
]

function areaProps (
  { disabled }: { disabled: { itemQuantity?: boolean, itemRarity?: boolean, packSize?: boolean } },
  ctx: FiltersCreationContext
): void {
  const { item } = ctx

  if (item.areaItemQuantity) {
    ctx.filters.push(propToFilter({
      ref: 'Item Quantity: +#%',
      tradeId: 'item.map_item_quantity',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.areaItemQuantity },
      sources: [],
      disabled: disabled.itemQuantity
    }, ctx))
  }
  if (item.areaItemRarity) {
    ctx.filters.push(propToFilter({
      ref: 'Item Rarity: +#%',
      tradeId: 'item.map_item_rarity',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.areaItemRarity },
      sources: [],
      disabled: disabled.itemRarity
    }, ctx))
  }
  if (item.areaPackSize) {
    ctx.filters.push(propToFilter({
      ref: 'Monster Pack Size: +#%',
      tradeId: 'item.map_pack_size',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.areaPackSize },
      sources: [],
      disabled: disabled.packSize
    }, ctx))
  }
}

export function mapProps (bulk: boolean, ctx: FiltersCreationContext): void {
  const { item } = ctx
  if (item.category !== ItemCategory.Map || item.mapCompletionReward || item.rarity === ItemRarity.Unique) return

  if (!bulk) {
    const hasValuableDrops = Boolean(item.mapMoreScarabs || item.mapMoreCurrency || item.mapMoreDivCards)

    areaProps({
      disabled: {
        itemQuantity: false,
        itemRarity: hasValuableDrops,
        packSize: false
      }
    }, ctx)

    if (item.mapMoreMaps) {
      ctx.filters.push(noSourcePseudoToFilter({
        pseudo: pseudoStatByRef(PSEUDO.MORE_MAPS)!,
        roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.mapMoreMaps },
        disabled: true
      }, ctx))
    }
    if (item.mapMoreScarabs) {
      ctx.filters.push(noSourcePseudoToFilter({
        pseudo: pseudoStatByRef(PSEUDO.MORE_SCARABS)!,
        roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.mapMoreScarabs },
        disabled: false
      }, ctx))
    }
    if (item.mapMoreCurrency) {
      ctx.filters.push(noSourcePseudoToFilter({
        pseudo: pseudoStatByRef(PSEUDO.MORE_CURRENCY)!,
        roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.mapMoreCurrency },
        disabled: false
      }, ctx))
    }
    if (item.mapMoreDivCards) {
      ctx.filters.push(noSourcePseudoToFilter({
        pseudo: pseudoStatByRef(PSEUDO.MORE_DIVINATION_CARDS)!,
        roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.mapMoreDivCards },
        disabled: false
      }, ctx))
    }
  }

  const explicitMods = item.newMods.filter(mod => mod.info.generation === 'prefix' || mod.info.generation === 'suffix')
  if (explicitMods.length === 8) {
    ctx.filters.push(noSourcePseudoToFilter({
      pseudo: pseudoStatByRef(PSEUDO.EXPLICIT_MODIFIERS)!,
      roll: { min: 0, max: 8, value: explicitMods.length },
      disabled: false
    }, { ...ctx, searchInRange: 0 }))
  }
}

export function chartProps (bulk: boolean, ctx: FiltersCreationContext): void {
  const { item } = ctx
  if (bulk || item.category !== ItemCategory.Chart) return

  areaProps({
    disabled: {
      itemQuantity: false,
      itemRarity: false,
      packSize: false
    }
  }, ctx)

  if (item.chartSulphur) {
    ctx.filters.push(propToFilter({
      ref: "Dead Man's Sulphur: +#%",
      tradeId: 'item.chart_sulphur',
      roll: { min: 0, max: Number.MAX_SAFE_INTEGER, value: item.chartSulphur },
      sources: [],
      disabled: false
    }, ctx))
  }
}

export function valdoBadMods (ctx: FiltersCreationContext): void {
  if (!ctx.item.mapCompletionReward) return

  for (const lethalStatRef of VALDO_LETHAL_STATS) {
    if (ctx.item.statsByType.some(calc => calc.stat.ref === lethalStatRef)) continue

    const lethalStat = findAndResolveByRef(lethalStatRef, ctx.item.category)
    const filter = statToNotFilter({
      stat: lethalStat,
      type: ModifierType.Explicit,
      disabled: false
    })
    ctx.filters.push(filter)
  }
}
