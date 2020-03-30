import { StatFilter } from './interfaces'
import { countDecimals } from '@/parser/utils'
import { Config } from '@/web/Config'

function percentRoll (value: number, p: number, method: Math['floor'] | Math['ceil']) {
  const res = value + value * p / 100

  const rounding = Math.pow(10, countDecimals(value))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function percentRollDelta (value: number, delta: number, p: number, method: Math['floor'] | Math['ceil']) {
  const res = value + delta * p / 100

  const rounding = Math.pow(10, countDecimals(value))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function rollToFilter (roll: number): Pick<StatFilter, 'roll' | 'min' | 'max' | 'defaultMin' | 'defaultMax'> {
  const percent = Config.store.searchStatRange

  return {
    roll,
    defaultMin: percentRoll(roll, -percent * Math.sign(roll), Math.floor),
    defaultMax: percentRoll(roll, +percent * Math.sign(roll), Math.ceil),
    min: percentRoll(roll, -percent * Math.sign(roll), Math.floor),
    max: undefined
  }
}
