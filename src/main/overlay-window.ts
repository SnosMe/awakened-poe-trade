import path from 'path'
import { BrowserWindow } from 'electron'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'

let overlayWindow: BrowserWindow | undefined
let isInteractable = false

export function createOverlayWindow () {
  overlayWindow = new BrowserWindow({
    icon: path.join(__static, 'icon.png'),
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false,
    show: false,
    focusable: false,
    transparent: true,
    fullscreen: true, // linux does not support changing at runtime, add config?
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as any,
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    overlayWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#overlay')
    // overlayWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    overlayWindow.loadURL('app://./index.html#overlay')
  }

  overlayWindow.setIgnoreMouseEvents(true)
  overlayWindow.once('ready-to-show', () => {
    // place here because of linux
    overlayWindow!.setAlwaysOnTop(true, 'pop-up-menu')
  })

  PoeWindow.once('active-change', () => {
    overlayWindow!.setBounds(PoeWindow.bounds!)
  })

  PoeWindow.on('active-change', (isActive) => {
    if (isActive) {
      overlayWindow!.show()
    } else {
      overlayWindow!.hide()
    }
  })
}

export function toggleOverlayState () {
  if (!overlayWindow) {
    logger.warn('Window is not ready', { source: 'overlay' })
    return
  }

  if (isInteractable) {
    overlayWindow.setIgnoreMouseEvents(true)
    isInteractable = false
  } else {
    overlayWindow.setIgnoreMouseEvents(false)
    isInteractable = true
  }
}
