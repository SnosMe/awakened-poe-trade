import { ParsedItem, ItemRarity } from '../parser'
import { ItemModifier } from '../parser/modifiers'
import { localStats } from './cleanup'
import { propAt20Quality, variablePropAt20Quality, QUALITY_STATS } from './calc-q20'
import { uniqueModFilter } from '../filters/unique-roll'
import { percentRoll, getRollAsSingleNumber } from '../filters/util'
import { filterPseudo } from '../filters/pseudo'

export interface UiModFilter {
  readonly tradeId: string | string[]
  readonly text: string
  readonly roll?: number
  readonly type: string
  readonly option?: ItemModifier['option']
  readonly defaultMin?: number
  readonly defaultMax?: number
  readonly boundMin?: number
  readonly boundMax?: number
  readonly variant?: true
  readonly hidden?: string
  disabled: boolean
  min: number | '' | undefined
  max: number | '' | undefined
}

export interface FiltersCreationContext {
  readonly item: ParsedItem
  filters: Writeable<UiModFilter>[]
  modifiers: ParsedItem['modifiers']
}

export type INTERNAL_TRADE_ID =
  'armour.armour' |
  'armour.evasion_rating' |
  'armour.energy_shield' |
  'weapon.physical_dps'

export const INTERNAL_TRADE_ID = [
  'armour.armour',
  'armour.evasion_rating',
  'armour.energy_shield',
  'weapon.physical_dps'
]

function filtersFromLocalProp (item: ParsedItem, modFilters: Writeable<UiModFilter>[]) {
  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    modFilters.push({
      tradeId: 'armour.armour' as INTERNAL_TRADE_ID,
      text: 'Armour',
      type: 'armour',
      roll: totalQ20,
      disabled: false,
      defaultMin: percentRoll(totalQ20, -10, Math.floor),
      defaultMax: percentRoll(totalQ20, +10, Math.ceil),
      min: percentRoll(totalQ20, -10, Math.floor),
      max: undefined
    })
  }

  if (item.props.evasion) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.evasion, QUALITY_STATS.EVASION, item))

    modFilters.push({
      tradeId: 'armour.evasion_rating' as INTERNAL_TRADE_ID,
      text: 'Evasion Rating',
      type: 'armour',
      roll: totalQ20,
      disabled: false,
      defaultMin: percentRoll(totalQ20, -10, Math.floor),
      defaultMax: percentRoll(totalQ20, +10, Math.ceil),
      min: percentRoll(totalQ20, -10, Math.floor),
      max: undefined
    })
  }

  if (item.props.energyShield) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.energyShield, QUALITY_STATS.ENERGY_SHIELD, item))

    modFilters.push({
      tradeId: 'armour.energy_shield' as INTERNAL_TRADE_ID,
      text: 'Energy Shield',
      type: 'armour',
      roll: totalQ20,
      disabled: false,
      defaultMin: percentRoll(totalQ20, -10, Math.floor),
      defaultMax: percentRoll(totalQ20, +10, Math.ceil),
      min: percentRoll(totalQ20, -10, Math.floor),
      max: undefined
    })
  }

  if (item.props.physicalDamage) {
    const damageQ20 = variablePropAt20Quality(item.props.physicalDamage, QUALITY_STATS.PHYSICAL_DAMAGE, item)

    const dpsQ20 = Math.floor((damageQ20[0] + damageQ20[1]) / 2 * item.props.attackSpeed!)

    modFilters.push({
      tradeId: 'weapon.physical_dps' as INTERNAL_TRADE_ID,
      text: 'Physical DPS',
      type: 'weapon',
      roll: dpsQ20,
      disabled: false,
      defaultMin: percentRoll(dpsQ20, -10, Math.floor),
      defaultMax: percentRoll(dpsQ20, +10, Math.ceil),
      min: percentRoll(dpsQ20, -10, Math.floor),
      max: undefined
    })
  }
}

export function initUiModFilters (item: ParsedItem): UiModFilter[] {
  const ctx: FiltersCreationContext = {
    item,
    filters: [],
    modifiers: [...item.modifiers]
  }

  if (item.rarity !== ItemRarity.Unique) {
    filtersFromLocalProp(item, ctx.filters)
    filterPseudo(ctx)
  }

  ctx.filters.push(...ctx.modifiers.map(mod => {
    const filter: Writeable<UiModFilter> = {
      tradeId: mod.modInfo.types.find(type => type.name === mod.type)!.tradeId,
      text: mod.modInfo.text,
      type: mod.type,
      option: mod.option,
      roll: undefined,
      disabled: true, // @TODO: can do very clever logic here
      min: undefined,
      max: undefined
    }

    if (item.rarity === ItemRarity.Unique) {
      const isKnown = uniqueModFilter(item, mod, filter)
      if (!isKnown) {
        itemModFilter(mod, filter)
      }
    } else {
      itemModFilter(mod, filter)
    }

    return filter
  }))

  if (
    item.rarity !== ItemRarity.Unique &&
    (item.props.armour ||
    item.props.evasion ||
    item.props.energyShield ||
    item.props.blockChance ||
    item.props.attackSpeed ||
    item.props.critChance ||
    item.props.elementalDamage ||
    item.props.physicalDamage)
  ) {
    ctx.filters
      .filter(f => localStats.has(f.text))
      .forEach(f => { f.hidden = 'Contributes to the item property' })
  }

  return ctx.filters
}

function itemModFilter (
  mod: ItemModifier,
  filter: Writeable<UiModFilter>
) {
  if (mod.condition) {
    filter.min = mod.condition.min
    filter.max = mod.condition.max
    filter.defaultMin = filter.min
    filter.defaultMax = filter.max
  } else if (!mod.option) {
    if (mod.values) {
      const roll = getRollAsSingleNumber(mod.values)
      filter.roll = roll
      filter.defaultMin = percentRoll(roll, -10 * Math.sign(roll), Math.floor)
      filter.defaultMax = percentRoll(roll, +10 * Math.sign(roll), Math.ceil)
      filter.min = filter.defaultMin
    }
  }
}
