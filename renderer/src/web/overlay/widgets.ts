export interface Widget {
  wmId: number
  wmType: string
  wmTitle: string
  wmWants: 'show' | 'hide'
  wmZorder: number | 'exclusive' | null
  wmFlags: Array<WellKnownFlag | string>
}

export type WellKnownFlag =
  'uninitialized' |
  'skip-menu' |
  'has-browser' |
  'invisible-on-blur' |
  'hide-on-blur' |
  'hide-on-focus' |
  'ignore-ui-visibility'

export interface Anchor {
  pos: string
  x: number
  y: number
}

export interface WidgetMenu extends Widget {
  anchor: Anchor
  alwaysShow: boolean
}

export interface PriceCheckWidget extends Widget {
  hotkey: string | null
  hotkeyHold: string
  hotkeyLocked: string | null
  showSeller: false | 'account' | 'ign'
  searchStatRange: number
  chaosPriceThreshold: number
  showRateLimitState: boolean
  apiLatencySeconds: number
  collapseListings: 'api' | 'app'
  smartInitialSearch: boolean
  lockedInitialSearch: boolean
  activateStockFilter: boolean
  showCursor: boolean
  requestPricePrediction: boolean
  builtinBrowser: boolean
}

export interface ItemCheckWidget extends Widget {
  hotkey: string | null
  wikiKey: string | null
  poedbKey: string | null
  craftOfExileKey: string | null
  stashSearchKey: string | null
  maps: {
    profile: number
    showNewStats: boolean
    selectedStats: Array<{
      matcher: string
      decision: string
    }>
  }
}

export interface StopwatchWidget extends Widget {
  anchor: Anchor
  toggleKey: string | null
  resetKey: string | null
}

export interface DelveGridWidget extends Widget {
  toggleKey: string | null
}

export interface StashSearchWidget extends Widget {
  anchor: Anchor
  entries: Array<{
    id: number
    name: string
    text: string
    hotkey: string | null
  }>
}

export interface ImageStripWidget extends Widget {
  anchor: Anchor
  images: Array<{
    id: number
    url: string
  }>
}

export interface ItemSearchWidget extends Widget {
  anchor: Anchor
  ocrGemsKey: string | null
}
