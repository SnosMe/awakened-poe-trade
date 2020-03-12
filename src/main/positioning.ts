import { BrowserWindow, ipcMain, screen, Rectangle, BrowserView } from 'electron'
import ioHook from 'iohook'
import { win, WIDTH, TITLE_HEIGHT } from './window'
import { checkPressPosition, isPollingClipboard } from './shortcuts'
import { PoeWindow } from './PoeWindow'
import { windowManager } from './window-manager'
import { PRICE_CHECK_HIDE, PRICE_CHECK_MOUSE, OPEN_LINK } from '../shared/ipc-event'
import { config } from './config'
import { leagues } from './tray'
import { logger } from './logger'

const CLOSE_THRESHOLD_PX = 40

let isWindowShown = false
let isWindowLocked = false
let isClickedAfterLock = false

let browserViewExternal: BrowserView | undefined

export function showWindow () {
  positionWindow(win)
  const wasLockedLinux = isWindowLocked
  if (isWindowShown && isWindowLocked) {
    logger.debug('Hide the window (was left in background)', { source: 'price-check', fn: 'showWindow' })
    hideWindow()
  }
  isWindowShown = true
  win.showInactive()
  if (process.platform === 'linux') {
    if (wasLockedLinux && config.get('altTabToGame')) {
      win.setSkipTaskbar(true) // fix: GNOME window is ready
    }
    win.setAlwaysOnTop(true) // X11: alwaysOnTop resets on show/hide
  }
}

function hideWindow () {
  logger.verbose('Hide window', { source: 'price-check', fn: 'hideWindow', wasLocked: isWindowLocked })

  isWindowShown = false
  if (isWindowLocked && config.get('altTabToGame')) {
    win.setSkipTaskbar(true)
    win.setAlwaysOnTop(true, 'screen-saver')
  }
  win.hide()
  win.setIgnoreMouseEvents(true)

  if (isWindowLocked) {
    isWindowLocked = false
    PoeWindow.isActive = true
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
  logger.verbose('Disable auto-hide and focus window', { source: 'price-check', fn: 'lockWindow', syntheticClick })
  isWindowLocked = true
  PoeWindow.isActive = false
  isClickedAfterLock = syntheticClick
  win.focus()
  if (config.get('altTabToGame')) {
    win.setSkipTaskbar(false)
    win.setAlwaysOnTop(false)
  }
  win.setIgnoreMouseEvents(false)
}

export function setupShowHide () {
  ipcMain.on(PRICE_CHECK_HIDE, () => { hideWindow() })

  ipcMain.on(PRICE_CHECK_MOUSE, (e, name: string, modifier?: string) => {
    if (name === 'click') {
      if (!isWindowShown) return // close button `click` event arrives after hide

      if (!isWindowLocked) {
        logger.debug('Clicked inside window fix', { source: 'price-check' })
        lockWindow(true)
      } else {
        isClickedAfterLock = true
        logger.debug('Clicked inside window after lock', { source: 'price-check' })
      }
    } else if (name === 'leave') {
      if (!isClickedAfterLock && leagues.length) {
        logger.debug('Mouse has left the window without a single click', { source: 'price-check' })
        hideWindow()
      }
    } else if (name === 'enter') {
      if (isWindowLocked) return

      if (modifier === config.get('priceCheckKeyHold')) {
        lockWindow()
      } else {
        logger.debug('Not locking window, the key is not held', { source: 'price-check' })
      }
    }
  })

  ipcMain.on(OPEN_LINK, (e, link) => {
    if (!browserViewExternal) {
      browserViewExternal = new BrowserView()
    }

    win.setBrowserView(browserViewExternal)
    win.setBounds(PoeWindow.bounds!)
    browserViewExternal.setBounds({
      x: 0,
      y: TITLE_HEIGHT,
      width: PoeWindow.bounds!.width - WIDTH,
      height: PoeWindow.bounds!.height - TITLE_HEIGHT
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

      logger.silly('Auto-hide mouse move', { source: 'price-check', distance, threshold: CLOSE_THRESHOLD_PX })
      if (distance > CLOSE_THRESHOLD_PX) {
        hideWindow()
      }
    }
  })
}

function positionWindow (tradeWindow: BrowserWindow) {
  const poePos = PoeWindow.bounds!

  const newBounds = poePos

  logger.debug('Reposition window', { source: 'price-check', newBounds, poeBounds: poePos })
  tradeWindow.setBounds(newBounds, false)
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
