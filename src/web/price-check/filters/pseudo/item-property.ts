import { rollToFilter } from '../util'
import { INTERNAL_TRADE_ID } from '../interfaces'
import { FiltersCreationContext, itemModFilterFull } from '../create-stat-filters'
import { propAt20Quality, variablePropAt20Quality, QUALITY_STATS } from './calc-q20'
import { stat } from '@/assets/data'
import { ARMOUR, WEAPON } from '@/parser/meta'

export function filterItemProp (ctx: FiltersCreationContext) {
  if (ARMOUR.has(ctx.item.category!)) {
    armourProps(ctx)
  }
  if (WEAPON.has(ctx.item.category!)) {
    weaponProps(ctx)
  }
}

export const ARMOUR_STATS = new Set<string>([
  QUALITY_STATS.ARMOUR.flat,
  QUALITY_STATS.EVASION.flat,
  QUALITY_STATS.ENERGY_SHIELD.flat,
  ...QUALITY_STATS.ARMOUR.incr,
  ...QUALITY_STATS.EVASION.incr,
  ...QUALITY_STATS.ENERGY_SHIELD.incr,
  stat('#% Chance to Block')
])

function armourProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    ctx.filters.push({
      tradeId: 'armour.armour' as INTERNAL_TRADE_ID,
      text: 'Armour',
      type: 'armour',
      disabled: false,
      ...rollToFilter(totalQ20)
    })
  }

  if (item.props.evasion) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.evasion, QUALITY_STATS.EVASION, item))

    ctx.filters.push({
      tradeId: 'armour.evasion_rating' as INTERNAL_TRADE_ID,
      text: 'Evasion Rating',
      type: 'armour',
      disabled: false,
      ...rollToFilter(totalQ20)
    })
  }

  if (item.props.energyShield) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.energyShield, QUALITY_STATS.ENERGY_SHIELD, item))

    ctx.filters.push({
      tradeId: 'armour.energy_shield' as INTERNAL_TRADE_ID,
      text: 'Energy Shield',
      type: 'armour',
      disabled: false,
      ...rollToFilter(totalQ20)
    })
  }

  if (item.props.blockChance) {
    ctx.filters.push({
      tradeId: 'armour.block' as INTERNAL_TRADE_ID,
      text: 'Block',
      type: 'armour',
      disabled: true,
      ...rollToFilter(item.props.blockChance)
    })
  }

  if (
    item.props.armour ||
    item.props.evasion ||
    item.props.energyShield ||
    item.props.blockChance
  ) {
    createHiddenFilters(ctx, ARMOUR_STATS)
  }
}

export const WEAPON_STATS = new Set<string>([
  QUALITY_STATS.PHYSICAL_DAMAGE.flat,
  ...QUALITY_STATS.PHYSICAL_DAMAGE.incr,
  stat('#% increased Attack Speed'),
  stat('#% increased Critical Strike Chance'),

  // stat('Adds # to # Chaos Damage'),
  stat('Adds # to # Lightning Damage'),
  stat('Adds # to # Cold Damage'),
  stat('Adds # to # Fire Damage')
])

function weaponProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  const physQ20 = variablePropAt20Quality(item.props.physicalDamage!, QUALITY_STATS.PHYSICAL_DAMAGE, item)
  const pdpsQ20 = Math.floor((physQ20[0] + physQ20[1]) / 2 * item.props.attackSpeed!)

  const edps = Math.floor((item.props.elementalDamage || 0) * item.props.attackSpeed!)
  const dps = pdpsQ20 + edps

  if (item.props.elementalDamage) {
    ctx.filters.push({
      tradeId: 'weapon.total_dps' as INTERNAL_TRADE_ID,
      text: 'DPS',
      type: 'weapon',
      disabled: false,
      ...rollToFilter(dps)
    })

    ctx.filters.push({
      tradeId: 'weapon.elemental_dps' as INTERNAL_TRADE_ID,
      text: 'Elemental DPS',
      type: 'weapon',
      disabled: (edps / dps < 0.67),
      hidden: (edps / dps < 0.67) ? 'Elemental damage is not the main source of DPS' : undefined,
      ...rollToFilter(edps)
    })
  }

  ctx.filters.push({
    tradeId: 'weapon.physical_dps' as INTERNAL_TRADE_ID,
    text: 'Physical DPS',
    type: 'weapon',
    disabled: (pdpsQ20 / dps < 0.67),
    hidden: (pdpsQ20 / dps < 0.67) ? 'Physical damage is not the main source of DPS' : undefined,
    ...rollToFilter(pdpsQ20)
  })

  ctx.filters.push({
    tradeId: 'weapon.crit' as INTERNAL_TRADE_ID,
    text: 'Critical Chance',
    type: 'weapon',
    disabled: true,
    ...rollToFilter(item.props.critChance!)
  })

  if (
    item.props.attackSpeed ||
    item.props.critChance ||
    item.props.elementalDamage ||
    item.props.physicalDamage
  ) {
    createHiddenFilters(ctx, WEAPON_STATS)
  }
}

function createHiddenFilters (ctx: FiltersCreationContext, stats: Set<string>) {
  for (const m of ctx.modifiers) {
    if (stats.has(m.modInfo.text)) {
      const filter = itemModFilterFull(m)
      filter.hidden = 'Contributes to the item property'
      ctx.filters.push(filter)
    }
  }

  ctx.modifiers = ctx.modifiers.filter(m => !stats.has(m.modInfo.text))
}
