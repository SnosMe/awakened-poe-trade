export const GET_CONFIG = 'get-config'
export const PUSH_CONFIG = 'push-config'

export const LEAGUES_READY = 'leagues-ready'
export const LEAGUE_SELECTED = 'league-selected'

export const PRICE_CHECK_HIDE = 'OVERLAY->MAIN::price-check-hide'

export const CLOSE_SETTINGS_WINDOW = 'close-settings-window'

export const UPDATE_AVAILABLE = 'update-available'

export const FOCUS_CHANGE = 'MAIN->OVERLAY::focus-change'
export interface IpcFocusChange {
  game: boolean
  overlay: boolean
  usingHotkey: boolean
}

export const DPR_CHANGE = 'OVERLAY->MAIN::devicePixelRatio-change'

export const PRICE_CHECK = 'MAIN->OVERLAY::price-check'
export const PRICE_CHECK_CANCELED = 'MAIN->OVERLAY::price-check-canceled'
export interface IpcPriceCheck {
  clipboard: string
  position: { x: number, y: number }
}

export const MAP_CHECK = 'MAIN->OVERLAY::map-check'
export interface IpcMapCheck {
  clipboard: string
  position: { x: number, y: number }
}

export const OVERLAY_READY = 'OVERLAY->MAIN::ready'

export const CLOSE_OVERLAY = 'OVERLAY->MAIN::close-overlay'

export const SHOW_BROWSER = 'OVERLAY->MAIN::show-browser'
export interface IpcShowBrowser {
  url?: string
}

export const HIDE_BROWSER = 'OVERLAY->MAIN::hide-browser'
export interface IpcHideBrowser {
  close?: boolean
}

export const VISIBILITY = 'MAIN->OVERLAY::visibility'
export interface IpcVisibility {
  isVisible: boolean
}

export const OPEN_SYSTEM_BROWSER = 'OVERLAY->MAIN::system-browser'
export interface IpcOpenSystemBrowser {
  url: string
}
