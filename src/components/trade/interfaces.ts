import { ParsedItem } from '../parser'
import { ItemModifier } from '../parser/modifiers'

export interface UiModFilter {
  readonly tradeId: string
  readonly text: string
  readonly roll: number | undefined
  readonly type: string
  readonly option: ItemModifier['option'] | undefined
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

export function initUiModFilters (item: ParsedItem): UiModFilter[] {
  return item.modifiers.map(mod => {
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
  })
}
