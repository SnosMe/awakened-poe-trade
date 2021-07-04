import { rollToFilter } from '../util'
import { FiltersCreationContext, itemModToFilter } from '../create-stat-filters'
import { propAt20Quality, QUALITY_STATS } from './calc-q20'
import { stat } from '@/assets/data'
import { ARMOUR, WEAPON, ItemCategory } from '@/parser/meta'
import { ParsedItem } from '@/parser'
import { internalPropStat } from './util'

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
  stat('+#% Chance to Block')
])

function armourProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    ctx.filters.push({
      ...internalPropStat(
        'armour.armour',
        'Armour: #',
        'armour'
      ),
      disabled: !isSingleAttrArmour(item),
      ...rollToFilter(totalQ20, { neverNegated: true })
    })
  }

  if (item.props.evasion) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.evasion, QUALITY_STATS.EVASION, item))

    ctx.filters.push({
      ...internalPropStat(
        'armour.evasion_rating',
        'Evasion Rating: #',
        'armour'
      ),
      disabled: !isSingleAttrArmour(item),
      ...rollToFilter(totalQ20, { neverNegated: true })
    })
  }

  if (item.props.energyShield) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.energyShield, QUALITY_STATS.ENERGY_SHIELD, item))

    ctx.filters.push({
      ...internalPropStat(
        'armour.energy_shield',
        'Energy Shield: #',
        'armour'
      ),
      disabled: !isSingleAttrArmour(item),
      ...rollToFilter(totalQ20, { neverNegated: true })
    })
  }

  if (item.props.blockChance) {
    ctx.filters.push({
      ...internalPropStat(
        'armour.block',
        'Block: #%',
        'armour'
      ),
      disabled: true,
      ...rollToFilter(item.props.blockChance, { neverNegated: true })
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

  const physQ20 = propAt20Quality(item.props.physicalDamage!, QUALITY_STATS.PHYSICAL_DAMAGE, item)
  const pdpsQ20 = Math.floor(physQ20 * item.props.attackSpeed!)

  const edps = Math.floor((item.props.elementalDamage || 0) * item.props.attackSpeed!)
  const dps = pdpsQ20 + edps

  if (item.props.elementalDamage) {
    ctx.filters.push({
      ...internalPropStat(
        'weapon.total_dps',
        'DPS: #',
        'weapon'
      ),
      disabled: false,
      ...rollToFilter(dps, { neverNegated: true })
    })

    ctx.filters.push({
      ...internalPropStat(
        'weapon.elemental_dps',
        'Elemental DPS: #',
        'weapon'
      ),
      disabled: (edps / dps < 0.67),
      hidden: (edps / dps < 0.67) ? 'Elemental damage is not the main source of DPS' : undefined,
      ...rollToFilter(edps, { neverNegated: true })
    })
  }

  ctx.filters.push({
    ...internalPropStat(
      'weapon.physical_dps',
      'Physical DPS: #',
      'weapon'
    ),
    disabled: !isPdpsImportant(item) || (pdpsQ20 / dps < 0.67),
    hidden: (pdpsQ20 / dps < 0.67) ? 'Physical damage is not the main source of DPS' : undefined,
    ...rollToFilter(pdpsQ20, { neverNegated: true })
  })

  ctx.filters.push({
    ...internalPropStat(
      'weapon.aps',
      'Attacks per Second: #',
      'weapon'
    ),
    disabled: true,
    ...rollToFilter(item.props.attackSpeed!, { neverNegated: true, dp: 2 })
  })

  ctx.filters.push({
    ...internalPropStat(
      'weapon.crit',
      'Critical Strike Chance: #%',
      'weapon'
    ),
    disabled: true,
    ...rollToFilter(item.props.critChance!, { neverNegated: true, dp: 1 })
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
    if (stats.has(m.stat.ref)) {
      const filter = itemModToFilter(m, ctx.item)
      filter.hidden = 'Contributes to the item property'
      ctx.filters.push(filter)
    }
  }

  ctx.modifiers = ctx.modifiers.filter(m => !stats.has(m.stat.ref))
}

function isSingleAttrArmour (item: ParsedItem) {
  return (item.props.armour != null && item.props.energyShield == null && item.props.evasion == null) ||
    (item.props.armour == null && item.props.energyShield != null && item.props.evasion == null) ||
    (item.props.armour == null && item.props.energyShield == null && item.props.evasion != null)
}

function isPdpsImportant (item: ParsedItem) {
  switch (item.category) {
    case ItemCategory.OneHandedAxe:
    case ItemCategory.TwoHandedAxe:
    case ItemCategory.OneHandedSword:
    case ItemCategory.TwoHandedSword:
    case ItemCategory.Bow:
    case ItemCategory.Warstaff:
      return true
    default:
      return false
  }
}
