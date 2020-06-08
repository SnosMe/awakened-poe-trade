import path from 'path'
import { BrowserWindow, ipcMain } from 'electron'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import { OVERLAY_READY, FOCUS_CHANGE } from '@/ipc/ipc-event'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { checkForUpdates } from './updates'
import { overlayWindow as OW } from 'electron-overlay-window'

export let overlayWindow: BrowserWindow | undefined
export let isInteractable = false

let _resolveOverlayReady: Function
export const overlayReady = new Promise<void>((resolve) => {
  _resolveOverlayReady = resolve
})

export async function createOverlayWindow () {
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

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    overlayWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#overlay')
    overlayWindow.webContents.openDevTools({ mode: 'detach', activate: false })
  } else {
    createProtocol('app')
    overlayWindow.loadURL('app://./index.html#overlay')
    checkForUpdates()
  }

  overlayWindow.setIgnoreMouseEvents(true)

  ipcMain.once(OVERLAY_READY, () => {
    _resolveOverlayReady()
  })

  PoeWindow.on('active-change', (isActive) => {
    if (!overlayWindow) {
      logger.error('Window is not ready')
      return
    }

    if (isActive && isInteractable) {
      isInteractable = false
      overlayWindow.setIgnoreMouseEvents(true)
    }
    overlayWindow.webContents.send(FOCUS_CHANGE, { game: isActive, overlay: isInteractable })
  })

  const electronReadyToShow = new Promise<void>((resolve) => {
    overlayWindow!.once('ready-to-show', resolve)
  })
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
  overlayWindow.webContents.send(FOCUS_CHANGE, { game: PoeWindow.isActive, overlay: isInteractable })
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
