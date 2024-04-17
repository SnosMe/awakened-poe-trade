import type { Widget, Anchor } from '../overlay/widgets.js'

export interface ItemSearchWidget extends Widget {
  anchor: Anchor
  ocrGemsKey: string | null
}
