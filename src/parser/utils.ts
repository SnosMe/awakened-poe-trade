export function countDecimals (num: number) {
  return !Number.isInteger(num)
    ? String(num).substring(String(num).indexOf('.') + 1).length
    : 0
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
