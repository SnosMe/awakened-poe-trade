import type { Config as AppConfig } from '@/ipc/types'
import type { GameConfig } from '@/main/game-config'

export const GET_CONFIG = 'get-config'
export const PUSH_CONFIG = 'push-config'
export interface IpcConfigs {
  app: AppConfig
  game: GameConfig | null
}

export const LEAGUES_READY = 'leagues-ready'
export const LEAGUE_SELECTED = 'league-selected'

export const PRICE_CHECK_HIDE = 'OVERLAY->MAIN::price-check-hide'

export const CLOSE_SETTINGS_WINDOW = 'close-settings-window'

export const UPDATE_AVAILABLE = 'update-available'
export interface IpcUpdateInfo {
  auto: boolean
  version: string
}

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
  lockedMode: boolean
}

export const ITEM_CHECK = 'MAIN->OVERLAY::item-check'
export interface IpcItemCheck {
  clipboard: string
  position: { x: number, y: number }
}

export const STASH_SEARCH = 'OVERLAY->MAIN::stash-search'
export interface IpcStashSearch {
  text: string
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

export const OPEN_WIKI = 'MAIN->OVERLAY::open-wiki'
export const OPEN_COE = 'MAIN->OVERLAY::open-craft-of-exile'
export const IMPORT_FILE = 'OVERLAY->MAIN::import-file'

export const TOGGLE_DELVE_GRID = 'MAIN->OVERLAY::delve-grid'

export const CLIENT_LOG_UPDATE = 'MAIN->OVERLAY::client-log'
export interface IpcClientLog {
  lines: string[]
}
