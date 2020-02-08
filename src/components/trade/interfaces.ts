import { ParsedItem } from '../parser'
import { ItemModifier } from '../parser/modifiers'
import { localStats, QUALITY_STATS } from './cleanup'

export interface UiModFilter {
  readonly tradeId: string
  readonly text: string
  readonly roll?: number
  readonly type: string
  readonly option?: ItemModifier['option']
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
      min: percentRoll(totalQ20, -10, Math.floor),
      max: percentRoll(totalQ20, +10, Math.ceil)
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
      min: percentRoll(totalQ20, -10, Math.floor),
      max: percentRoll(totalQ20, +10, Math.ceil)
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
      min: percentRoll(totalQ20, -10, Math.floor),
      max: percentRoll(totalQ20, +10, Math.ceil)
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
      min: percentRoll(dpsQ20, -10, Math.floor),
      max: percentRoll(dpsQ20, +10, Math.ceil)
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
      max: undefined,
      min: undefined
    }

    if (mod.condition) {
      filter.min = mod.condition.min
      filter.max = mod.condition.max
    } else if (!mod.option) {
      if (mod.values) {
        const roll = getRollAsSingleNumber(mod.values)
        filter.roll = roll
        filter.min = percentRoll(roll, -10 * Math.sign(roll), Math.floor)
        filter.max = percentRoll(roll, +10 * Math.sign(roll), Math.ceil)
      }
    }

    return filter
  }))

  return modFilters
}

function propAt20Quality (
  total: number,
  stats: { flat: string, incr: string[] },
  item: ParsedItem
): number {
  let incr = 0
  let flat = 0

  for (const mod of item.modifiers) {
    if (mod.modInfo.text === stats.flat) {
      flat = mod.values![0]
    } else if (stats.incr.includes(mod.modInfo.text)) {
      incr += mod.values![0]
    }
  }

  const base = calcBase(total, incr, flat, item.quality)
  return calcQ20(base, incr, flat)
}

function variablePropAt20Quality (
  total: number[],
  stats: { flat: string, incr: string[] },
  item: ParsedItem
): number[] {
  let incr = 0
  let flat = [0, 0]

  for (const mod of item.modifiers) {
    if (mod.modInfo.text === stats.flat) {
      flat = mod.values!
    } else if (stats.incr.includes(mod.modInfo.text)) {
      incr += mod.values![0]
    }
  }

  const base = [
    calcBase(total[0], incr, flat[0], item.quality),
    calcBase(total[1], incr, flat[1], item.quality)
  ]

  return [
    Math.round(calcQ20(base[0], incr, flat[0])),
    Math.round(calcQ20(base[1], incr, flat[1]))
  ]
}

function calcBase (total: number, incr: number, flat: number, quality: number | undefined) {
  return Math.round((total / (1 + incr / 100 + (quality || 0) / 100)) - flat)
}

function calcQ20 (base: number, incr: number, flat: number) {
  return (base + flat) * (1 + incr / 100 + 20 / 100)
}
