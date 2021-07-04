import { StatFilter } from './interfaces'
import { Config } from '@/web/Config'

function showDecimals (value: number, dp: number | boolean): number {
  if (typeof dp === 'number') {
    return dp
  } else if (!dp || Math.abs(value) > 2) {
    return 0
  } else {
    return Math.abs(value) < 1 ? 2 : 1
  }
}

export function percentRoll (value: number, p: number, method: Math['floor'] | Math['ceil'], dp: number | boolean = false): number {
  const res = value + value * p / 100

  const rounding = Math.pow(10, showDecimals(value, dp))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function percentRollDelta (value: number, delta: number, p: number, method: Math['floor'] | Math['ceil'], dp = false): number {
  const res = value + delta * p / 100

  const rounding = Math.pow(10, showDecimals(value, dp))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function rollToFilter (
  roll: number,
  opts?: { neverNegated?: true, dp?: boolean | number }
): Pick<StatFilter, 'roll' | 'min' | 'max' | 'defaultMin' | 'defaultMax'> {
  const percent = Config.store.searchStatRange

  // opts.neverNegated is false only in one case, but keep it
  // disabled by default, so opts.neverNegated acts more like
  // acknowledgment of what you are doing
  return {
    roll: percentRoll(roll, 0, Math.floor, opts?.dp),
    defaultMin: percentRoll(roll, -percent * Math.sign(roll), Math.floor, opts?.dp),
    defaultMax: percentRoll(roll, +percent * Math.sign(roll), Math.ceil, opts?.dp),
    min: opts?.neverNegated ? percentRoll(roll, -percent * Math.sign(roll), Math.floor, opts.dp) : undefined,
    max: undefined
  }
}
