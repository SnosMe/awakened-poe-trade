import { StatFilter } from './interfaces'
import { rollCountDecimals } from '@/parser/utils'
import { Config } from '@/web/Config'

function percentRoll (value: number, p: number, method: Math['floor'] | Math['ceil'], decimals?: number) {
  const res = value + value * p / 100

  const rounding = Math.pow(10, decimals != null ? decimals : rollCountDecimals(value))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function percentRollDelta (value: number, delta: number, p: number, method: Math['floor'] | Math['ceil']) {
  const res = value + delta * p / 100

  const rounding = Math.pow(10, rollCountDecimals(value))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function rollToFilter (
  roll: number,
  opts?: {
    neverNegated?: true
    decimals?: number
}): Pick<StatFilter, 'roll' | 'min' | 'max' | 'defaultMin' | 'defaultMax'> {
  const percent = Config.store.searchStatRange

  // opts.neverNegated is false only in one case, but keep it
  // disabled by default, so opts.neverNegated acts more like
  // acknowledgment of what you are doing
  return {
    roll,
    defaultMin: percentRoll(roll, -percent * Math.sign(roll), Math.floor, opts?.decimals),
    defaultMax: percentRoll(roll, +percent * Math.sign(roll), Math.ceil, opts?.decimals),
    min: opts?.neverNegated ? percentRoll(roll, -percent * Math.sign(roll), Math.floor, opts.decimals) : undefined,
    max: undefined
  }
}
