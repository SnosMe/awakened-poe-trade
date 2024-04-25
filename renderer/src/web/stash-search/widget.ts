import type { Widget, Anchor } from '../overlay/widgets.js'

export interface StashSearchWidget extends Widget {
  anchor: Anchor
  enableHotkeys: boolean
  entries: Array<{
    id: number
    name: string
    text: string
    hotkey: string | null
  }>
}
