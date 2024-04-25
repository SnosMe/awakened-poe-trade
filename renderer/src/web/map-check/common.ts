export interface MapCheckConfig {
  profile: number
  showNewStats: boolean
  selectedStats: Array<{
    matcher: string
    decision: string
  }>
}

export enum StatTag {
  Outdated = 1,
  HeistExclusive,
  UberMapExclusive
}

export interface StatMatcher {
  matchStr: string
  tag?: StatTag
}

export function decisionHasColor (decisionSet: string, profileName: number) {
  // Three profiles stored as "---"
  // -: undefined
  // d: deadly mod
  // w: warning
  // g: good mod
  // s: marked as seen
  const idx = profileName - 1
  return decisionSet[idx] !== '-' && decisionSet[idx] !== 's'
}

export function nextDecision (current: string): string {
  switch (current) {
    case 'd': return 'w'
    case 'w': return 'g'
    case 'g': return 's'
  }
  return 'd'
}

export function decisionCreate (value: string, profileName: number, updateSet = '---') {
  const idx = profileName - 1
  const split = updateSet.split('')
  split[idx] = value
  return split.join('')
}
