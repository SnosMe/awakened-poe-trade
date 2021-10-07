import type { StatFilter } from './interfaces'

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
  opts: { percent: number, neverNegated?: true, dp?: boolean | number }
): StatFilter['roll'] {
  const { percent, neverNegated, dp } = opts

  // opts.neverNegated is false only in one case, but keep it
  // disabled by default, so opts.neverNegated acts more like
  // acknowledgment of what you are doing
  return {
    value: percentRoll(roll, 0, Math.floor, dp),
    default: {
      min: percentRoll(roll, -percent * Math.sign(roll), Math.floor, dp),
      max: percentRoll(roll, +percent * Math.sign(roll), Math.ceil, dp)
    },
    min: neverNegated ? percentRoll(roll, -percent * Math.sign(roll), Math.floor, dp) : undefined,
    max: undefined
  }
}
