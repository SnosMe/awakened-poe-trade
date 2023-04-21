export interface HostConfig {
  shortcuts: ShortcutAction[]
  restoreClipboard: boolean
  clientLog: string | null
  gameConfig: string | null
  stashScroll: boolean
  overlayKey: string
  logLevel: string
  windowTitle: string
  language: string
}

export interface ShortcutAction {
  shortcut: string
  keepModKeys?: true
  action: {
    type: 'copy-item'
    focusOverlay?: boolean
    target: string
  } | {
    type: 'ocr-text'
    target: 'heist-gems'
  } | {
    type: 'trigger-event'
    target: string
  } | {
    type: 'stash-search'
    text: string
  } | {
    type: 'toggle-overlay'
  } | {
    type: 'paste-in-chat'
    text: string
    send: boolean
  } | {
    type: 'test-only'
  }
}

export type UpdateInfo =
  {
    state: 'initial' | 'checking-for-update'
  } | {
    state: 'update-available'
    version: string
    noDownloadReason: 'not-supported' | 'disabled-by-flag' | null
  } | {
    state: 'update-downloaded'
    version: string
  } | {
    state: 'update-not-available' | 'error'
    checkedAt: number
  }

export interface HostState {
  contents: string | null
  version: string
  updater: UpdateInfo
}

export type IpcEvent =
  // events that have meaning only in Overlay mode:
  IpcOverlayAttached |
  IpcFocusChange |
  IpcVisibility |
  IpcFocusGame |
  IpcHideExclusiveWidget |
  IpcTrackArea |
  // events used by any type of Client:
  IpcSaveConfig |
  IpcUpdaterState |
  IpcGameLog |
  IpcClientIsActive |
  IpcLogEntry |
  IpcHostConfig |
  IpcWidgetAction |
  IpcItemText |
  IpcOcrText |
  IpcConfigChanged |
  IpcUserAction

export type IpcEventPayload<Name extends IpcEvent['name'], T extends IpcEvent = IpcEvent> =
  T extends { name: Name, payload: infer P } ? P : never

type IpcOverlayAttached =
  Event<'MAIN->OVERLAY::overlay-attached'>

type IpcFocusChange =
  Event<'MAIN->OVERLAY::focus-change', {
    game: boolean
    overlay: boolean
    usingHotkey: boolean
  }>

type IpcVisibility =
  Event<'MAIN->OVERLAY::visibility', {
    isVisible: boolean
  }>

type IpcFocusGame =
  Event<'OVERLAY->MAIN::focus-game'>

type IpcHideExclusiveWidget =
  Event<'MAIN->OVERLAY::hide-exclusive-widget'>

type IpcTrackArea =
  Event<'OVERLAY->MAIN::track-area', {
    holdKey: string
    closeThreshold: number
    from: { x: number, y: number }
    area: { x: number, y: number, width: number, height: number }
    dpr: number
  }>

type IpcHostConfig =
  Event<'CLIENT->MAIN::update-host-config', HostConfig>

type IpcClientIsActive =
  Event<'CLIENT->MAIN::used-recently', {
    isOverlay: boolean
  }>

type IpcSaveConfig =
  Event<'CLIENT->MAIN::save-config', {
    contents: string
    isTemporary: boolean
  }>

type IpcConfigChanged =
  Event<'MAIN->CLIENT::config-changed', {
    contents: string
  }>

type IpcLogEntry =
  Event<'MAIN->CLIENT::log-entry', {
    message: string
  }>

type IpcWidgetAction =
  Event<'MAIN->CLIENT::widget-action', {
    target: string
  }>

type IpcItemText =
  Event<'MAIN->CLIENT::item-text', {
    target: string
    clipboard: string
    position: { x: number, y: number }
    focusOverlay: boolean
  }>

type IpcOcrText =
  Event<'MAIN->CLIENT::ocr-text', {
    target: string
    pressTime: number
    ocrTime: number
    paragraphs: string[]
  }>

type IpcGameLog =
  Event<'MAIN->CLIENT::game-log', {
    lines: string[]
  }>

type IpcUpdaterState =
  Event<'MAIN->CLIENT::updater-state', UpdateInfo>

// Hotkeyable actions are defined in `ShortcutAction`.
// Actions below are triggered by user interaction with the UI.
type IpcUserAction =
  Event<'CLIENT->MAIN::user-action', {
    action: 'check-for-update' | 'update-and-restart' | 'quit'
  } | {
    action: 'stash-search'
    text: string
  }>

interface Event<TName extends string, TPayload = undefined> {
  name: TName
  payload: TPayload
}
