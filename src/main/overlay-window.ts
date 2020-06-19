import path from 'path'
import { BrowserWindow, ipcMain, dialog } from 'electron'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import * as ipc from '@/ipc/ipc-event'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { overlayWindow as OW } from 'electron-overlay-window'

export let overlayWindow: BrowserWindow | undefined
export let isInteractable = false
export let DPR = 1

let _resolveOverlayReady: () => void
export const overlayReady = new Promise<void>((resolve) => {
  _resolveOverlayReady = resolve
})

export async function createOverlayWindow () {
  ipcMain.once(ipc.OVERLAY_READY, _resolveOverlayReady)
  ipcMain.on(ipc.DPR_CHANGE, (_: any, dpr: number) => handleDprChange(dpr))
  PoeWindow.on('active-change', handlePoeWindowActiveChange)
  PoeWindow.onceAttached(handleOverlayAttached)

  overlayWindow = new BrowserWindow({
    icon: path.join(__static, 'icon.png'),
    ...OW.WINDOW_OPTS,
    width: 800,
    height: 600,
    // backgroundColor: '#00000008',
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as any,
      webSecurity: false
    }
  })

  overlayWindow.setIgnoreMouseEvents(true)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    overlayWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#overlay')
    overlayWindow.webContents.openDevTools({ mode: 'detach', activate: false })
  } else {
    createProtocol('app')
    overlayWindow.loadURL('app://./index.html#overlay')
  }

  const electronReadyToShow = new Promise<void>(resolve =>
    overlayWindow!.once('ready-to-show', resolve))
  await electronReadyToShow
  await overlayReady
  PoeWindow.attach(overlayWindow)
}

export function toggleOverlayState () {
  if (!overlayWindow) {
    logger.warn('Window is not ready', { source: 'overlay' })
    return
  }
  if (isInteractable) {
    focusPoE()
  } else {
    focusOverlay()
  }
  overlayWindow.webContents.send(ipc.FOCUS_CHANGE, { game: PoeWindow.isActive, overlay: isInteractable })
}

function handlePoeWindowActiveChange (isActive: boolean) {
  if (isActive && isInteractable) {
    isInteractable = false
    overlayWindow!.setIgnoreMouseEvents(true)
  }
  overlayWindow!.webContents.send(ipc.FOCUS_CHANGE, { game: isActive, overlay: isInteractable })
}

export function assertOverlayActive () {
  if (!overlayWindow || isInteractable) return

  focusOverlay()
}

export function assertPoEActive () {
  if (!overlayWindow || !isInteractable) return

  focusPoE()
}

function focusOverlay () {
  if (!overlayWindow) return

  overlayWindow.setIgnoreMouseEvents(false)
  isInteractable = true
  OW.activateOverlay()
  PoeWindow.isActive = false
}

function focusPoE () {
  if (!overlayWindow) return

  overlayWindow.setIgnoreMouseEvents(true)
  isInteractable = false
  OW.focusTarget()
  PoeWindow.isActive = true
}

function handleOverlayAttached (hasAccess?: boolean) {
  if (hasAccess === false) {
    dialog.showErrorBox(
      'PoE window - No access',
      // ----------------------
      'Path of Exile is running with administrator rights.\n' +
      '\n' +
      'You need to restart Awakened PoE Trade with administrator rights.'
    )
  }
}

function handleDprChange (devicePixelRatio: number) {
  if (process.platform === 'win32') {
    DPR = devicePixelRatio
  }
}
