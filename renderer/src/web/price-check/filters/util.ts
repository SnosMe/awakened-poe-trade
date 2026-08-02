function decimalPlaces (value: number, dp: number | boolean): number {
  if (typeof dp === 'number') {
    return dp
  } else if (!dp || Math.abs(value) >= 10) {
    return 0
  } else {
    return (Math.abs(value) < 2.3) ? 2 : 1
  }
}

export function roundRoll (value: number, dp: boolean) {
  const rounding = Math.pow(10, decimalPlaces(value, dp))
  return Math.trunc(value * rounding) / rounding
}

// Sentinel for `searchStatRange`, alongside `0` meaning "exact value".
// Negative so it can never collide with a real percentage.
export const STAT_RANGE_ROUND = -1

// Smallest power of ten that turns the value into a whole number.
function wholeNumberScale (value: number): number {
  for (const scale of [1, 10, 100]) {
    if (Math.abs(value * scale - Math.round(value * scale)) < 1e-9) return scale
  }
  return 1000
}

// Snaps to a "round" value a buyer would actually type into trade: multiples
// of 5 below 50, multiples of 10 at or above it. Widens outward like
// `percentRoll` does — `Math.floor` for the min side, `Math.ceil` for the max
// side — so the item always falls inside its own filter (42 -> 40+).
export function roundedRoll (
  value: number,
  method: Math['floor'] | Math['ceil'],
  dp: boolean
): number {
  // Fractional stats scale up to a whole number so they use the same
  // breakpoints as everything else: 6.4 goes 64 -> 60 -> 6.0, and 2.95 goes
  // 295 -> 290 -> 2.9.
  const scale = (dp) ? wholeNumberScale(value) : 1
  const scaled = Math.round(value * scale)

  // Single digits once scaled (+3 to level of gems, 0.9 attacks per second)
  // have no useful breakpoint between them, so leave them alone. This also
  // keeps small rolls off 0, which would drop the constraint entirely.
  if (Math.abs(scaled) < 10) {
    return roundRoll(value, dp)
  }

  const step = (Math.abs(scaled) < 50) ? 5 : 10
  return (method(scaled / step) * step) / scale
}

export function percentRoll (
  value: number,
  p: number,
  method: Math['floor'] | Math['ceil'],
  dp: number | boolean = false
): number {
  const res = value + Math.abs(value) * p / 100
  const rounding = Math.pow(10, decimalPlaces(value, dp))
  return method((res + Number.EPSILON) * rounding) / rounding
}

export function percentRollDelta (
  value: number,
  delta: number,
  p: number,
  method: Math['floor'] | Math['ceil'],
  dp = false
): number {
  const res = value + delta * p / 100
  const rounding = Math.pow(10, decimalPlaces(value, dp))
  return method((res + Number.EPSILON) * rounding) / rounding
}
