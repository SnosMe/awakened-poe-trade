export const GET_CONFIG = "get-config";
export const PUSH_CONFIG = "push-config";

export const LEAGUES_READY = "leagues-ready";
export const LEAGUE_SELECTED = "league-selected";

export const PRICE_CHECK_HIDE = "OVERLAY->MAIN::price-check-hide";

export const CLOSE_SETTINGS_WINDOW = "close-settings-window";

export const UPDATE_AVAILABLE = "update-available";

export const FOCUS_CHANGE = "MAIN->OVERLAY::focus-change";
export interface IpcFocusChange {
  game: boolean;
  overlay: boolean;
  usingHotkey: boolean;
}

export const DPR_CHANGE = "OVERLAY->MAIN::devicePixelRatio-change";

export const PRICE_CHECK = "MAIN->OVERLAY::price-check";
export const PRICE_CHECK_CANCELED = "MAIN->OVERLAY::price-check-canceled";
export interface IpcPriceCheck {
  clipboard: string;
  position: { x: number; y: number };
}

export const MAP_CHECK = "MAIN->OVERLAY::map-check";
export interface IpcMapCheck {
  clipboard: string;
  position: { x: number; y: number };
}

export const STASH_SEARCH = "OVERLAY->MAIN::stash-search";
export interface IpcStashSearch {
  text: string;
}

export const OVERLAY_READY = "OVERLAY->MAIN::ready";

export const CLOSE_OVERLAY = "OVERLAY->MAIN::close-overlay";

export const SHOW_BROWSER = "OVERLAY->MAIN::show-browser";
export interface IpcShowBrowser {
  url?: string;
}

export const HIDE_BROWSER = "OVERLAY->MAIN::hide-browser";
export interface IpcHideBrowser {
  close?: boolean;
}

export const VISIBILITY = "MAIN->OVERLAY::visibility";
export interface IpcVisibility {
  isVisible: boolean;
}

export const OPEN_SYSTEM_BROWSER = "OVERLAY->MAIN::system-browser";
export interface IpcOpenSystemBrowser {
  url: string;
}

export const OPEN_WIKI = "MAIN->OVERLAY::open-wiki";

export const IMPORT_FILE = "OVERLAY->MAIN::import-file";

export const NEW_INCOMING_OFFER = "MAIN->OVERLAY::incoming-offer";
export const NEW_OUTGOING_OFFER = "MAIN->OVERLAY::outoging-offer";
export const SEND_STILL_INTERESTED_WHISPER =
  "OVERLAY->MAIN::send-still-interested-whisper";
export const SEND_PARTY_INVITE_CMD = "OVERLAY->MAIN::send-party-invite-cmd";
export const SEND_PARTY_KICK_CMD = "OVERLAY->MAIN::send-party-kick-cmd";
export const SEND_THANKS_WHISPER = "OVERLAY->MAIN::send-thanks-whisper";
export const SEND_SOLD_WHISPER = "OVERLAY->MAIN::send-sold-whisper";
export const SEND_BUSY_WHISPER = "OVERLAY->MAIN::send-busy-whisper";
export const SEND_TRADE_REQUEST_CMD = "OVERLAY->MAIN::send-trade-request";
export const TRADE_ACCEPTED = "MAIN->OVERLAY::trade-accepted";
export const TRADE_CANCELLED = "MAIN->OVERLAY::trade-cancelled";
export const HIGHLIGHT_OFFER_ITEM = "MAIN->OVERLAY::highlight-offer-item";

export const FOCUS_GAME = "OVERLAY->MAIN::focus-game";
