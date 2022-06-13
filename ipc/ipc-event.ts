import type { Config } from './types'

export type IpcEvent =
  IpcGetConfig |
  IpcSaveConfig |
  IpcPriceCheckHide |
  IpcUpdateInfo |
  IpcFocusChange |
  IpcDPRChange |
  IpcPriceCheck |
  IpcPriceCheckCanceled |
  IpcItemCheck |
  IpcStashSearch |
  IpcOverlayReady |
  IpcCloseOverlay |
  IpcVisibility |
  IpcOpenWiki |
  IpcOpenCraftOfExile |
  IpcImportFile |
  IpcToggleDelveGrid |
  IpcClientLog |
  IpcStopwatchAction

export type IpcEventPayload<Name extends IpcEvent['name'], T extends IpcEvent = IpcEvent> =
  T extends { name: Name, payload: infer P } ? P : never

export type IpcGetConfig =
  Event<'OVERLAY->MAIN::get-config', Config>

export type IpcSaveConfig =
  Event<'OVERLAY->MAIN::save-config', Config>

export type IpcPriceCheckHide =
  Event<'OVERLAY->MAIN::price-check-hide'>

export type IpcUpdateInfo =
  Event<'MAIN->OVERLAY::update-available', {
    auto: boolean
    version: string
  }>

export type IpcFocusChange =
  Event<'MAIN->OVERLAY::focus-change', {
    game: boolean
    overlay: boolean
    usingHotkey: boolean
  }>

export type IpcDPRChange =
  Event<'OVERLAY->MAIN::devicePixelRatio-change', number>

export type IpcPriceCheck =
  Event<'MAIN->OVERLAY::price-check', {
    clipboard: string
    position: { x: number, y: number }
    lockedMode: boolean
  }>

export type IpcPriceCheckCanceled =
  Event<'MAIN->OVERLAY::price-check-canceled'>

export type IpcItemCheck =
  Event<'MAIN->OVERLAY::item-check', {
    clipboard: string
    position: { x: number, y: number }
  }>

export type IpcStashSearch =
  Event<'OVERLAY->MAIN::stash-search', {
    text: string
  }>

export type IpcOverlayReady =
  Event<'OVERLAY->MAIN::ready'>

export type IpcCloseOverlay =
  Event<'OVERLAY->MAIN::close-overlay'>

export type IpcVisibility =
  Event<'MAIN->OVERLAY::visibility', {
    isVisible: boolean
  }>

export type IpcOpenWiki =
  Event<'MAIN->OVERLAY::open-wiki', {
    clipboard: string
    position: { x: number, y: number }
  }>

export type IpcOpenCraftOfExile =
  Event<'MAIN->OVERLAY::open-craft-of-exile', {
    clipboard: string
    position: { x: number, y: number }
  }>

export type IpcImportFile =
  Event<'OVERLAY->MAIN::import-file', string>

export type IpcToggleDelveGrid =
  Event<'MAIN->OVERLAY::delve-grid'>

export type IpcClientLog =
  Event<'MAIN->OVERLAY::client-log', {
    lines: string[]
  }>

export type IpcStopwatchAction =
  Event<'MAIN->OVERLAY::stopwatch', {
    wmId: number
    type: 'start-stop' | 'reset'
  }>

interface Event<TName extends string, TPayload = undefined> {
  name: TName
  payload: TPayload
}
