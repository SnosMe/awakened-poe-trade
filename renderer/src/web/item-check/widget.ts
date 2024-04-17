import type { Widget } from '../overlay/widgets.js'
import type { MapCheckConfig } from '../map-check/common.js'

export interface ItemCheckWidget extends Widget {
  hotkey: string | null
  wikiKey: string | null
  poedbKey: string | null
  craftOfExileKey: string | null
  stashSearchKey: string | null
  maps: MapCheckConfig
}
