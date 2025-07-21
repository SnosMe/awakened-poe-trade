import type { Widget, Anchor } from '../overlay/widgets.js'

export interface OrbUsageWidget extends Widget {
  anchor: Anchor
  maxAttempts: number
  stashGrid: { width: number; height: number }
  itemGrid: { width: number; height: number }
  delayBetweenItems: number
  delayBetweenRounds: number
  stashMode: boolean // true = stash processing, false = single item
  isRunning: boolean // indicator for current state
  lastOperation: 'none' | 'single' | 'stash' | 'analyze' // last operation type
} 