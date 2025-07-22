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
  useCustomColors: boolean // true = use custom color thresholds, false = default thresholds
  customColorThresholds: {
    matched: { saturation: number; value: number }
    unmatched: { saturation: number; value: number }
  }
  scanAreaSize: number // size of the scan area in pixels for color analysis
} 