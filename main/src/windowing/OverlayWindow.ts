import path from 'path'
import { BrowserWindow, dialog, shell, Menu, systemPreferences, WebContents } from 'electron'
import { OverlayController, OVERLAY_WINDOW_OPTS } from 'electron-overlay-window'
import type { ServerEvents } from '../server'
import type { Logger } from '../RemoteLogger'
import type { GameWindow } from './GameWindow'
import { type HttpProxy, PROXY_HOSTS } from '../proxy'

export class OverlayWindow {
  public isInteractable = false
  public wasUsedRecently = true
  private window: BrowserWindow
  private overlayKey: string = 'Shift + Space'
  private isOverlayKeyUsed = false

  constructor (
    private server: ServerEvents,
    private logger: Logger,
    private poeWindow: GameWindow,
    proxy: HttpProxy
  ) {
    if (process.platform === 'win32' && !systemPreferences.isAeroGlassEnabled()) {
      dialog.showErrorBox(
        'Windows 7 - Aero',
        // ----------------------
        '您必须在“外观和个性化”中启用Windows Aero (简中作者不知道这是啥).\n' +
        '需要创建透明覆盖窗口.'
      )
    }

    this.server.onEventAnyClient('OVERLAY->MAIN::focus-game', this.assertGameActive)
    this.poeWindow.on('active-change', this.handlePoeWindowActiveChange)
    this.poeWindow.onAttach(this.handleOverlayAttached)

    this.window = new BrowserWindow({
      icon: path.join(__dirname, process.env.STATIC!, 'icon.png'),
      ...OVERLAY_WINDOW_OPTS,
      width: 800,
      height: 600,
      webPreferences: {
        allowRunningInsecureContent: false,
        webviewTag: true,
        spellcheck: false
      }
    })

    this.window.setMenu(Menu.buildFromTemplate([
      { role: 'editMenu' },
      { role: 'reload' },
      { role: 'toggleDevTools' }
    ]))

    this.window.webContents.on('before-input-event', this.handleExtraCommands)
    this.window.webContents.on('did-attach-webview', (_, webviewWebContents) => {
      webviewWebContents.on('before-input-event', this.handleExtraCommands)
    })

    spyOnPathofexileCookies(this.window.webContents, proxy.cookiesForPoe)

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    this.server.onEventAnyClient('CLIENT->MAIN::used-recently', (e) => {
      this.wasUsedRecently = e.isOverlay
    })
  }

  loadAppPage (port: number) {
    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(process.env.VITE_DEV_SERVER_URL)
      this.window.webContents.openDevTools({ mode: 'detach', activate: false })
    } else {
      this.window.loadURL(`http://localhost:${port}/index.html`)
    }
  }

  assertOverlayActive = () => {
    if (!this.isInteractable) {
      this.isInteractable = true
      OverlayController.activateOverlay()
      this.poeWindow.isActive = false
    }
  }

  assertGameActive = () => {
    if (this.isInteractable) {
      this.isInteractable = false
      OverlayController.focusTarget()
      this.poeWindow.isActive = true
    }
  }

  toggleActiveState = () => {
    this.isOverlayKeyUsed = true
    if (this.isInteractable) {
      this.assertGameActive()
    } else {
      this.assertOverlayActive()
    }
  }

  updateOpts (overlayKey: string, windowTitle: string) {
    this.overlayKey = overlayKey
    this.poeWindow.attach(this.window, windowTitle)
  }

  private handleExtraCommands = (event: Electron.Event, input: Electron.Input) => {
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
        process.nextTick(this.assertGameActive)
        break
      }
      case this.overlayKey: {
        event.preventDefault()
        process.nextTick(this.toggleActiveState)
        break
      }
    }
  }

  private handleOverlayAttached = (hasAccess?: boolean) => {
    if (hasAccess === false) {
      this.logger.write('error [Overlay] PoE is running with administrator rights')

      dialog.showErrorBox(
        '打开窗口失败',
        // ----------------------
        '流放之路客户端正以管理员权限运行\n' +
        '\n' +
        '请重新以管理员权限打开本程序'
      )
    } else {
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->OVERLAY::overlay-attached',
        payload: undefined
      })
    }
  }

  private handlePoeWindowActiveChange = (isActive: boolean) => {
    if (isActive && this.isInteractable) {
      this.isInteractable = false
    }
    this.server.sendEventTo('broadcast', {
      name: 'MAIN->OVERLAY::focus-change',
      payload: {
        game: isActive,
        overlay: this.isInteractable,
        usingHotkey: this.isOverlayKeyUsed
      }
    })
    this.isOverlayKeyUsed = false
  }
}

function spyOnPathofexileCookies (webContents: WebContents, map: Map<string, string>) {
  const urls = PROXY_HOSTS
    .filter(({ official }) => official)
    .map(({ host }) => `https://${host}/*`)

  webContents.session.webRequest.onHeadersReceived({ urls }, (details, next) => {
    for (const key in details.responseHeaders) {
      if (key.toLowerCase() === 'set-cookie') {
        for (const cookie of details.responseHeaders[key]) {
          const [key, value] = cookie.split(';', 1)[0].split('=', 2)
          map.set(key, value)
        }
        break
      }
    }
    next({ responseHeaders: details?.responseHeaders })
  })

  webContents.session.webRequest.onBeforeSendHeaders({ urls }, (details, next) => {
    for (const key in details.requestHeaders) {
      if (key.toLowerCase() === 'cookie') {
        for (const part of details.requestHeaders[key].split(';')) {
          const [key, value] = part.trim().split('=', 2)
          map.set(key, value)
        }
        break
      }
    }
    next({ requestHeaders: details.requestHeaders })
  })
}
