import { percentRollDelta } from '../util'
import { INTERNAL_TRADE_ID, StatFilter } from '../interfaces'
import { FiltersCreationContext, itemModToFilter } from '../create-stat-filters'
import { propAt20Quality, variablePropAt20Quality, QUALITY_STATS } from './calc-q20'
import { stat, Uniques } from '@/assets/data'
import { ARMOUR, WEAPON } from '@/parser/meta'
import { Config } from '@/web/Config'

export function filterUniqueItemProp (ctx: FiltersCreationContext) {
  if (ARMOUR.has(ctx.item.category!)) {
    armourProps(ctx)
  }
  if (WEAPON.has(ctx.item.category!)) {
    weaponProps(ctx)
  }
}

const ARMOUR_STATS = new Set<string>([
  QUALITY_STATS.ARMOUR.flat,
  QUALITY_STATS.EVASION.flat,
  QUALITY_STATS.ENERGY_SHIELD.flat,
  ...QUALITY_STATS.ARMOUR.incr,
  ...QUALITY_STATS.EVASION.incr,
  ...QUALITY_STATS.ENERGY_SHIELD.incr
])

function armourProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  const uniqueInfo = Uniques.get(`${item.name} ${item.baseType}`)

  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    ctx.filters.push(propToFilter(
      totalQ20,
      uniqueInfo?.props.ar,
      'armour.armour',
      'armour',
      'Armour: #'
    ))
  }

  if (item.props.evasion) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.evasion, QUALITY_STATS.EVASION, item))

    ctx.filters.push(propToFilter(
      totalQ20,
      uniqueInfo?.props.ev,
      'armour.evasion_rating',
      'armour',
      'Evasion Rating: #'
    ))
  }

  if (item.props.energyShield) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.energyShield, QUALITY_STATS.ENERGY_SHIELD, item))

    ctx.filters.push(propToFilter(
      totalQ20,
      uniqueInfo?.props.es,
      'armour.energy_shield',
      'armour',
      'Energy Shield: #'
    ))
  }

  createHiddenFilters(ctx, ARMOUR_STATS)
}

const WEAPON_STATS = new Set<string>([
  QUALITY_STATS.PHYSICAL_DAMAGE.flat,
  ...QUALITY_STATS.PHYSICAL_DAMAGE.incr,
  stat('#% increased Attack Speed')
])

function weaponProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  const uniqueInfo = Uniques.get(`${item.name} ${item.baseType}`)

  if (item.props.physicalDamage) {
    const physQ20 = variablePropAt20Quality(item.props.physicalDamage!, QUALITY_STATS.PHYSICAL_DAMAGE, item)
    const pdpsQ20 = Math.floor((physQ20[0] + physQ20[1]) / 2 * item.props.attackSpeed!)

    ctx.filters.push(propToFilter(
      pdpsQ20,
      uniqueInfo?.props.pdps,
      'weapon.physical_dps',
      'weapon',
      'Physical DPS: #'
    ))
  }

  createHiddenFilters(ctx, WEAPON_STATS)
}

function createHiddenFilters (ctx: FiltersCreationContext, stats: Set<string>) {
  for (const m of ctx.modifiers) {
    if (stats.has(m.stat.ref)) {
      const filter = itemModToFilter(m, ctx.item)
      filter.hidden = 'Contributes to the item property'
      ctx.filters.push(filter)
    }
  }

  ctx.modifiers = ctx.modifiers.filter(m => !stats.has(m.stat.ref))
}

const TOLERANCE = 4

function isWithinBounds (value: number, bounds: { min: number, max: number }) {
  return ((value + TOLERANCE) >= bounds.min) && ((value - TOLERANCE) <= bounds.max)
}

function propToFilter (
  totalQ20: number,
  propInfo: { min: number, max: number } | undefined,
  tradeId: INTERNAL_TRADE_ID,
  type: 'armour' | 'weapon',
  text: string
): StatFilter {
  if (propInfo && isWithinBounds(totalQ20, propInfo)) {
    if (propInfo.min === propInfo.max) {
      return ({
        tradeId: [tradeId],
        text,
        type,
        disabled: true,
        hidden: 'Roll is not variable',
        defaultMin: totalQ20,
        defaultMax: totalQ20,
        min: totalQ20,
        max: totalQ20,
        roll: totalQ20
      })
    } else {
      const percent = Config.store.searchStatRange * 2
      return ({
        tradeId: [tradeId],
        text,
        type,
        disabled: true,
        boundMin: propInfo.min,
        boundMax: propInfo.max,
        defaultMin: Math.max(percentRollDelta(totalQ20, (propInfo.max - propInfo.min), -percent, Math.floor), propInfo.min),
        defaultMax: Math.min(percentRollDelta(totalQ20, (propInfo.max - propInfo.min), +percent, Math.ceil), propInfo.max),
        min: totalQ20,
        max: undefined,
        roll: totalQ20
      })
    }
  } else {
    // missing unique (Two-Toned Boots) / stat affecting prop is variant (Atziri's Splendour) / corrupted implicit affecting prop
    return ({
      tradeId: [tradeId],
      text,
      type,
      disabled: true,
      defaultMin: totalQ20,
      defaultMax: totalQ20,
      min: totalQ20,
      max: undefined,
      roll: totalQ20
    })
  }
}
