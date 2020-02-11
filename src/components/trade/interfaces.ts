import { ParsedItem } from '../parser'
import { ItemModifier } from '../parser/modifiers'
import { localStats } from './cleanup'
import { propAt20Quality, variablePropAt20Quality, QUALITY_STATS } from './calc-q20'

export interface UiModFilter {
  readonly tradeId: string
  readonly text: string
  readonly roll?: number
  readonly type: string
  readonly option?: ItemModifier['option']
  readonly defaultMin?: number
  readonly defaultMax?: number
  disabled: boolean
  min: number | '' | undefined
  max: number | '' | undefined
}

function countDecimals (num: number) {
  return !Number.isInteger(num)
    ? String(num).substring(String(num).indexOf('.') + 1).length
    : 0
}

function percentRoll (value: number, p: number, method: Math['floor'] | Math['ceil']) {
  const res = value + value * p / 100

  const rounding = Math.pow(10, countDecimals(value))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function getRollAsSingleNumber (values: number[]): number {
  if (values.length === 1) {
    return values[0]
  } else {
    const avg = (values[0] + values[1]) / 2

    const maxPrecision = Math.max(countDecimals(values[0]), countDecimals(values[1]))
    const rounding = Math.pow(10, maxPrecision)
    return Math.floor((avg + Number.EPSILON) * rounding) / rounding
  }
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

export function initUiModFilters (item: ParsedItem): UiModFilter[] {
  let parsedMods = item.modifiers
  const modFilters = [] as Writeable<UiModFilter>[]

  if (item.props.armour) {
    const totalQ20 = Math.floor(propAt20Quality(item.props.armour, QUALITY_STATS.ARMOUR, item))

    modFilters.unshift({
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

    modFilters.unshift({
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

    modFilters.unshift({
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

    modFilters.unshift({
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

  if (
    item.props.armour ||
    item.props.evasion ||
    item.props.energyShield ||
    item.props.blockChance ||
    item.props.attackSpeed ||
    item.props.critChance ||
    item.props.elementalDamage ||
    item.props.physicalDamage
  ) {
    parsedMods = parsedMods.filter(mod => !localStats.has(mod.modInfo.text))
  }

  parsedMods = parsedMods.filter(
    mod => mod.modInfo.types.find(type => type.name === mod.type)!.tradeId != null
  )

  modFilters.push(...parsedMods.map(mod => {
    const filter: Writeable<UiModFilter> = {
      tradeId: mod.modInfo.types.find(type => type.name === mod.type)!.tradeId!,
      text: mod.modInfo.text,
      type: mod.type,
      option: mod.option,
      roll: undefined,
      disabled: true, // @TODO: can do very clever logic here
      min: undefined,
      max: undefined
    }

    if (mod.condition) {
      filter.min = mod.condition.min
      filter.max = mod.condition.max
    } else if (!mod.option) {
      if (mod.values) {
        const roll = getRollAsSingleNumber(mod.values)
        filter.roll = roll
        filter.defaultMin = percentRoll(roll, -10 * Math.sign(roll), Math.floor)
        filter.defaultMax = percentRoll(roll, +10 * Math.sign(roll), Math.ceil)
        filter.min = filter.defaultMin
      }
    }

    return filter
  }))

  return modFilters
}
