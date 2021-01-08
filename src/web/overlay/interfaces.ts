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
  widgets: Widget[]
  show (wmId: number): void
  hide (wmId: number): void
  remove (wmId: number): void
  bringToTop (wmId: number): void
  create (wmType: string): void 
}

export interface WidgetMenu extends Widget {
  anchor: Anchor
  alwaysShow: boolean
}
