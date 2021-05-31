export interface Widget {
  wmId: number
  wmType: string
  wmTitle: string
  wmWants: 'show' | 'hide'
  wmZorder: number | 'exclusive' | null
  wmFlags: Array<WellKnownFlag | string>
  // ---------------
  [key: string]: unknown
}

export type WellKnownFlag =
  'uninitialized' |
  'skip-menu' |
  'has-browser' |
  'invisible-on-blur' |
  'hide-on-blur' |
  'hide-on-blur(close)' |
  'hide-on-focus'

export interface Anchor {
  pos: string
  x: number
  y: number
}

export interface WidgetManager {
  poeUiWidth: number
  width: number
  height: number
  active: boolean
  widgets: Widget[]
  show: (wmId: number) => void
  hide: (wmId: number) => void
  remove: (wmId: number) => void
  bringToTop: (wmId: number) => void
  create: (wmType: string) => void
  showBrowser: (wmId: number, url: string) => void
  closeBrowser: (wmId: number) => void
  setFlag: (wmId: number, flag: string, state: boolean) => void
}

export interface WidgetMenu extends Widget {
  anchor: Anchor
  alwaysShow: boolean
}

export interface PriceCheckWidget extends Widget {
  chaosPriceThreshold: number
  showRateLimitState: boolean
  apiLatencySeconds: number
  collapseListings: 'api' | 'app'
  smartInitialSearch: boolean
  lockedInitialSearch: boolean
  activateStockFilter: boolean
}

export interface ItemCheckWidget extends Widget {
  maps: {
    showNewStats: boolean
    selectedStats: Array<{
      matcher: string
      decision: string
    }>
  }
}

export interface StopwatchWidget extends Widget {
  anchor: Anchor
}

export interface StashSearchWidget extends Widget {
  anchor: Anchor
  entries: Array<{
    id: number
    text: string
  }>
}

export interface ImageStripWidget extends Widget {
  anchor: Anchor
  images: Array<{
    id: number
    url: string
  }>
}
