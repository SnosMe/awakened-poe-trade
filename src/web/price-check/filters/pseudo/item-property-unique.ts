import { rollToFilter } from '../util'
import { FiltersCreationContext, itemModToFilter } from '../create-stat-filters'
import { propAt20Quality, QUALITY_STATS } from './calc-q20'
import { ARMOUR, WEAPON } from '@/parser/meta'
import { internalPropStat } from './util'

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

  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    ctx.filters.push({
      ...internalPropStat(
        'armour.armour',
        'Armour: #',
        'armour'
      ),
      disabled: true,
      hidden: (item.isCorrupted) ? undefined : 'Hidden for sake of familiar view of item stats',
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
      disabled: true,
      hidden: (item.isCorrupted) ? undefined : 'Hidden for sake of familiar view of item stats',
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
      disabled: true,
      hidden: (item.isCorrupted) ? undefined : 'Hidden for sake of familiar view of item stats',
      ...rollToFilter(totalQ20, { neverNegated: true })
    })
  }

  createHiddenFilters(ctx, ARMOUR_STATS)
}

const WEAPON_STATS = new Set<string>([
  QUALITY_STATS.PHYSICAL_DAMAGE.flat,
  ...QUALITY_STATS.PHYSICAL_DAMAGE.incr
])

function weaponProps (ctx: FiltersCreationContext) {
  const { item } = ctx

  if (item.props.physicalDamage) {
    const physQ20 = propAt20Quality(item.props.physicalDamage, QUALITY_STATS.PHYSICAL_DAMAGE, item)
    const pdpsQ20 = Math.floor(physQ20 * item.props.attackSpeed!)

    ctx.filters.push({
      ...internalPropStat(
        'weapon.physical_dps',
        'Physical DPS: #',
        'weapon'
      ),
      disabled: true,
      hidden: (item.isCorrupted) ? undefined : 'Hidden for sake of familiar view of item stats',
      ...rollToFilter(pdpsQ20, { neverNegated: true })
    })
  }

  createHiddenFilters(ctx, WEAPON_STATS)
}

function createHiddenFilters (ctx: FiltersCreationContext, stats: Set<string>) {
  if (ctx.item.isCorrupted) {
    for (const m of ctx.modifiers) {
      if (stats.has(m.stat.ref)) {
        const filter = itemModToFilter(m, ctx.item)
        filter.hidden = 'Contributes to the item property'
        ctx.filters.push(filter)
      }
    }

    ctx.modifiers = ctx.modifiers.filter(m => !stats.has(m.stat.ref))
  }
}
