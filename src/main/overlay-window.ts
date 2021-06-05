import path from 'path'
import { BrowserWindow, ipcMain, dialog, Menu, systemPreferences } from 'electron'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import * as ipc from '@/ipc/ipc-event'
import { overlayWindow as OW } from 'electron-overlay-window'
import { config } from './config'

export let overlayWindow: BrowserWindow | undefined
export let isInteractable = false
export let DPR = 1

let _resolveOverlayReady: () => void
export const overlayReady = new Promise<void>((resolve) => {
  _resolveOverlayReady = resolve
})

export async function createOverlayWindow () {
  if (process.platform === 'win32' && !systemPreferences.isAeroGlassEnabled()) {
    dialog.showErrorBox(
      'Windows 7 - Aero',
      // ----------------------
      'You must enable Windows Aero in "Appearance and Personalization".\n' +
      'It is required to create a transparent overlay window.'
    )
  }

  ipcMain.once(ipc.OVERLAY_READY, _resolveOverlayReady)
  ipcMain.on(ipc.DPR_CHANGE, (_: any, dpr: number) => handleDprChange(dpr))
  ipcMain.on(ipc.CLOSE_OVERLAY, assertPoEActive)
  PoeWindow.on('active-change', handlePoeWindowActiveChange)
  PoeWindow.onAttach(handleOverlayAttached)

  overlayWindow = new BrowserWindow({
    icon: path.join(__static, 'icon.png'),
    ...OW.WINDOW_OPTS,
    width: 800,
    height: 600,
    // backgroundColor: '#00000008',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      defaultFontSize: config.get('fontSize')
    }
  })

  overlayWindow.setIgnoreMouseEvents(true)

  overlayWindow.setMenu(Menu.buildFromTemplate([
    { role: 'editMenu' },
    { role: 'reload' },
    { role: 'toggleDevTools' }
  ]))
  overlayWindow.webContents.on('before-input-event', handleExtraCommands)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    overlayWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#overlay')
    overlayWindow.webContents.openDevTools({ mode: 'detach', activate: false })
  } else {
    overlayWindow.loadURL('app://./index.html#overlay')
  }

  const electronReadyToShow = new Promise<void>(resolve =>
    overlayWindow!.once('ready-to-show', resolve))
  await electronReadyToShow
  await overlayReady
  PoeWindow.attach(overlayWindow)
}

let _isOverlayKeyUsed = false
export function toggleOverlayState () {
  if (!overlayWindow) {
    logger.warn('Window is not ready', { source: 'overlay' })
    return
  }
  _isOverlayKeyUsed = true
  if (isInteractable) {
    focusPoE()
  } else {
    focusOverlay()
  }
}

function handlePoeWindowActiveChange (isActive: boolean) {
  if (isActive && isInteractable) {
    isInteractable = false
    overlayWindow!.setIgnoreMouseEvents(true)
  }
  overlayWindow!.webContents.send(ipc.FOCUS_CHANGE, {
    game: isActive,
    overlay: isInteractable,
    usingHotkey: _isOverlayKeyUsed
  } as ipc.IpcFocusChange)

  _isOverlayKeyUsed = false
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
    logger.error('PoE is running with administrator rights', { source: 'overlay' })

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

export function handleExtraCommands (event: Electron.Event, input: Electron.Input) {
  if (input.type !== 'keyDown') return

  let { code, control: ctrlKey, shift: shiftKey, alt: altKey } = input

  if (code.startsWith('Key')) {
    code = code.substr('Key'.length)
  } else if (code.startsWith('Digit')) {
    code = code.substr('Digit'.length)
  }

  if (shiftKey && altKey) code = `Shift + Alt + ${code}`
  else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`
  else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`
  else if (altKey) code = `Alt + ${code}`
  else if (ctrlKey) code = `Ctrl + ${code}`
  else if (shiftKey) code = `Shift + ${code}`

  switch (code) {
    case 'Escape':
    case 'Ctrl + W': {
      event.preventDefault()
      process.nextTick(assertPoEActive)
      break
    }
    case config.get('overlayKey'): {
      event.preventDefault()
      process.nextTick(toggleOverlayState)
      break
    }
  }
}
