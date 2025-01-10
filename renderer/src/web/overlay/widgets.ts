export interface Widget {
  wmId: number
  wmType: string
  wmTitle: string
  wmWants: 'show' | 'hide'
  wmZorder: number | 'exclusive' | null
  wmFlags: Array<WellKnownFlag | string>
}

export interface WidgetSpec {
  type: string
  instances: 'single' | 'multi'
  trNameKey?: string
  initInstance?: () => Widget
  defaultInstances?: () => Widget[]
}

export type WellKnownFlag =
  'uninitialized' |
  'menu::skip' |
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
  showRateLimitState: boolean
  apiLatencySeconds: number
  collapseListings: 'api' | 'app'
  smartInitialSearch: boolean
  lockedInitialSearch: boolean
  activateStockFilter: boolean
  showCursor: boolean
  requestPricePrediction: boolean
  builtinBrowser: boolean
  rememberCurrency: boolean
}

export interface StopwatchWidget extends Widget {
  anchor: Anchor
  toggleKey: string | null
  resetKey: string | null
}

export interface DelveGridWidget extends Widget {
  toggleKey: string | null
}

export interface ImageStripWidget extends Widget {
  anchor: Anchor
  images: Array<{
    id: number
    url: string
  }>
}
