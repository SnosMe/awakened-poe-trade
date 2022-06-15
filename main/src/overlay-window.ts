import path from 'path'
import assert from 'assert'
import { BrowserWindow, ipcMain, dialog, shell, Menu, systemPreferences, IpcMainEvent, WebContents } from 'electron'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import * as ipc from '../../ipc/ipc-event'
import { OverlayWindow as OW } from 'electron-overlay-window'
import { config } from './config'

let overlayWindow: BrowserWindow | undefined
export let isInteractable = false
export let DPR = 1

let _resolveOverlayReady: () => void
export const overlayReady = new Promise<void>((resolve) => {
  _resolveOverlayReady = resolve
})

export function overlaySendEvent (event: ipc.IpcEvent) {
  assert.ok(overlayWindow)
  overlayWindow.webContents.send('named-event', event)
}

export function overlayOnEvent<Name extends ipc.IpcEvent['name']> (
  name: Name,
  cb: (e: IpcMainEvent, payload: ipc.IpcEventPayload<Name>) => void
) {
  ipcMain.on(name, cb)
}

export async function createOverlayWindow () {
  if (process.platform === 'win32' && !systemPreferences.isAeroGlassEnabled()) {
    dialog.showErrorBox(
      'Windows 7 - Aero',
      // ----------------------
      'You must enable Windows Aero in "Appearance and Personalization".\n' +
      'It is required to create a transparent overlay window.'
    )
  }

  overlayOnEvent('OVERLAY->MAIN::ready', _resolveOverlayReady)
  overlayOnEvent('OVERLAY->MAIN::devicePixelRatio-change', (_, dpr) => handleDprChange(dpr))
  overlayOnEvent('OVERLAY->MAIN::close-overlay', assertPoEActive)
  PoeWindow.on('active-change', handlePoeWindowActiveChange)
  PoeWindow.onAttach(handleOverlayAttached)

  overlayWindow = new BrowserWindow({
    icon: path.join(__dirname, process.env.STATIC!, 'icon.png'),
    ...OW.WINDOW_OPTS,
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: false,
      webviewTag: true,
      spellcheck: false,
      defaultFontSize: config.get('fontSize'),
      preload: path.join(__dirname, 'preload.js')
    }
  })

  overlayWindow.setMenu(Menu.buildFromTemplate([
    { role: 'editMenu' },
    { role: 'reload' },
    { role: 'toggleDevTools' }
  ]))
  overlayWindow.webContents.on('before-input-event', handleExtraCommands)
  overlayWindow.webContents.on('did-attach-webview', (_, webviewWebContents) => {
    webviewWebContents.on('before-input-event', handleExtraCommands)
  })

  modifyResponseHeaders(overlayWindow.webContents)

  overlayWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    overlayWindow.webContents.openDevTools({ mode: 'detach', activate: false })
  } else {
    overlayWindow.loadURL('app://./index.html')
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
  }
  overlaySendEvent({
    name: 'MAIN->OVERLAY::focus-change',
    payload: {
      game: isActive,
      overlay: isInteractable,
      usingHotkey: _isOverlayKeyUsed
    }
  })

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

  isInteractable = true
  OW.activateOverlay()
  PoeWindow.isActive = false
}

function focusPoE () {
  if (!overlayWindow) return

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

function handleExtraCommands (event: Electron.Event, input: Electron.Input) {
  if (input.type !== 'keyDown') return

  let { code, control: ctrlKey, shift: shiftKey, alt: altKey } = input

  if (code.startsWith('Key')) {
    code = code.slice('Key'.length)
  } else if (code.startsWith('Digit')) {
    code = code.slice('Digit'.length)
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

function modifyResponseHeaders (webContents: WebContents) {
  webContents.session.webRequest.onHeadersReceived({
    urls: ['https://*/*']
  }, (details, next) => {
    if (!details.responseHeaders) return next({})

    for (const key in details.responseHeaders) {
      if (key.toLowerCase() === 'set-cookie') {
        details.responseHeaders[key] = details.responseHeaders[key].map(cookie => {
          cookie = cookie
            .split(';')
            .map(_ => _.trim())
            .filter(_ =>
              !_.toLowerCase().startsWith('samesite') &&
              !_.toLowerCase().startsWith('secure'))
            .join('; ')

          return `${cookie}; SameSite=None; Secure`
        })
      }
    }

    next({ responseHeaders: details.responseHeaders })
  })
}
