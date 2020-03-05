import { BrowserWindow, ipcMain, screen, Rectangle, BrowserView } from 'electron'
import ioHook from 'iohook'
import { win } from './window'
import { checkPressPosition, isPollingClipboard } from './shortcuts'
import { PoeWindow } from './PoeWindow'
import { windowManager } from './window-manager'
import { PRICE_CHECK_HIDE, PRICE_CHECK_MOUSE, OPEN_LINK } from '../shared/ipc-event'
import { config } from './config'

const CLOSE_THRESHOLD_PX = 40

let isWindowShown = true
let isWindowLocked = false
let isClickedAfterLock = false

let lastPoePos: Rectangle
let browserViewExternal: BrowserView | undefined

export async function showWindow () {
  positionWindow(win)
  if (isWindowShown && isWindowLocked) {
    hideWindow()
  }
  isWindowShown = true
  win.showInactive()
  if (process.platform === 'linux') {
    win.setAlwaysOnTop(true)
  }
}

function hideWindow () {
  isWindowShown = false
  win.hide()

  if (isWindowLocked) {
    isWindowLocked = false
    PoeWindow.isActive = true
    if (config.get('altTabToGame')) {
      win.setSkipTaskbar(true)
      win.setAlwaysOnTop(true)
    }
    if (process.platform === 'win32') {
      windowManager.focusWindowById(PoeWindow.pid!)
    }
    if (browserViewExternal) {
      win.removeBrowserView(browserViewExternal)
      // uncomment to trade performance for less memory usage (1 process & 13 MB)
      // browserViewExternal.destroy()
      // browserViewExternal = undefined
      browserViewExternal.webContents.loadURL('about:blank')
    }
  }
}

export function lockWindow (syntheticClick = false) {
  isWindowLocked = true
  PoeWindow.isActive = false
  isClickedAfterLock = syntheticClick
  win.focus()
  if (config.get('altTabToGame')) {
    win.setSkipTaskbar(false)
    win.setAlwaysOnTop(false)
  }
}

export function setupShowHide () {
  ipcMain.on(PRICE_CHECK_HIDE, () => { hideWindow() })

  ipcMain.on(PRICE_CHECK_MOUSE, (e, name: string, modifier?: string) => {
    if (name === 'click') {
      isClickedAfterLock = true
      isWindowLocked = true
    } else if (name === 'leave') {
      if (!isClickedAfterLock) {
        hideWindow()
      }
    } else if (name === 'enter') {
      if (modifier === config.get('priceCheckKeyHold')) {
        lockWindow()
      }
    }
  })

  ipcMain.on(OPEN_LINK, (e, link) => {
    if (!browserViewExternal) {
      browserViewExternal = new BrowserView()
    }

    win.setBrowserView(browserViewExternal)
    win.setBounds(lastPoePos)
    browserViewExternal.setBounds({
      x: 0,
      y: 24,
      width: lastPoePos.width - 460,
      height: lastPoePos.height - 24
    })
    browserViewExternal.webContents.loadURL(link)
  })

  ioHook.on('mousemove', (e: { x: number, y: number, ctrlKey?: boolean, shiftKey?: boolean }) => {
    const modifier = e.ctrlKey ? 'Ctrl' : e.shiftKey ? 'Shift' : undefined
    if (!isPollingClipboard && checkPressPosition && isWindowShown && !isWindowLocked && modifier !== config.get('priceCheckKeyHold')) {
      let distance: number
      if (process.platform === 'linux' /* @TODO: && displays.length > 1 */) {
        // ioHook returns mouse position that is not compatible with electron's position
        // when user has more than one monitor
        const cursorNow = screen.getCursorScreenPoint()
        distance = Math.hypot(cursorNow.x - checkPressPosition.x, cursorNow.y - checkPressPosition.y)
      } else {
        distance = Math.hypot(e.x - checkPressPosition.x, e.y - checkPressPosition.y)
      }

      if (distance > CLOSE_THRESHOLD_PX) {
        isWindowShown = false
        win.hide()
      }
    }
  })
}

function positionWindow (tradeWindow: BrowserWindow) {
  const poePos = PoeWindow.bounds!
  lastPoePos = poePos

  tradeWindow.setBounds({
    x: getOffsetX(poePos),
    y: poePos.y,
    width: 460,
    height: poePos.height
  }, false)
}

function getOffsetX (poePos: Rectangle): number {
  const mousePos = screen.getCursorScreenPoint()

  if (mousePos.x > (poePos.x + poePos.width / 2)) {
    // inventory
    return (poePos.x + poePos.width) - poeUserInterfaceWidth(poePos.height) - 460
  } else {
    // stash or chat
    return poePos.x + poeUserInterfaceWidth(poePos.height)
  }
}

export function poeUserInterfaceWidth (windowHeight: number) {
  // sidebar is 370px at 800x600
  const ratio = 370 / 600
  return Math.round(windowHeight * ratio)
}
