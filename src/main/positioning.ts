import { BrowserWindow, ipcMain, screen, Rectangle, BrowserView, Point, app, shell } from 'electron'
import ioHook from 'iohook'
import { win, WIDTH } from './window'
import { checkPressPosition, isPollingClipboard } from './shortcuts'
import { PoeWindow } from './PoeWindow'
import { windowManager } from './window-manager'
import { PRICE_CHECK_HIDE, PRICE_CHECK_MOUSE, OPEN_LINK, OPEN_LINK_EXTERNAL } from '@/ipc/ipc-event'
import { config } from './config'
import { logger } from './logger'

const CLOSE_THRESHOLD_PX = 40

let isWindowShown = false
let isWindowLocked = false
let isClickedAfterLock = false
let priceCheckActualBounds : Rectangle | undefined
let isMouseInside = false

let browserViewExternal: BrowserView | undefined

let COUNT_DISPALYS = 1
app.on('ready', () => {
  COUNT_DISPALYS = screen.getAllDisplays().length
})

export function showWindow (willLocked?: boolean) {
  positionWindow(win)
  if (isWindowShown && isWindowLocked) {
    logger.debug('Hide the window (was left in background)', { source: 'price-check', fn: 'showWindow' })
    hideWindow(true, willLocked)
  }

  isWindowShown = true
  win.showInactive()
  win.moveTop()
  // alternative
  // if (!willLocked) {
  //   win.setAlwaysOnTop(true, 'screen-saver')
  // }
}

function hideWindow (willShow?: boolean, willLocked?: boolean) {
  logger.verbose('Hide window', { source: 'price-check', fn: 'hideWindow', wasLocked: isWindowLocked })

  isWindowShown = false
  isMouseInside = false
  if (isWindowLocked && config.get('altTabToGame') && !willLocked) {
    win.setSkipTaskbar(true)
    win.setAlwaysOnTop(true, 'screen-saver')
    if (process.platform === 'win32' && willShow) {
      win.hide()
    }
  }
  if (!willShow) {
    win.hide()
    priceCheckActualBounds = undefined
  }
  win.setIgnoreMouseEvents(true)

  if (isWindowLocked) {
    isWindowLocked = false
    PoeWindow.isActive = true
    if (process.platform === 'win32' && !willShow) {
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
}

export function setupShowHide () {
  ipcMain.on(PRICE_CHECK_HIDE, () => { hideWindow() })

  ipcMain.on(PRICE_CHECK_MOUSE, (e, name: string, modifier?: string) => {
    if (name === 'click') {
      if (!isWindowShown) return // close button `click` event arrives after hide

      if (!isWindowLocked) {
        logger.debug('Clicked inside window fix', { source: 'price-check' })
        lockWindow(true)
        isMouseInside = true
      } else {
        isClickedAfterLock = true
        isMouseInside = true
        logger.debug('Clicked inside window after lock', { source: 'price-check' })
      }
    } else if (name === 'leave') {
      isMouseInside = false
      win.setIgnoreMouseEvents(true)

      if (!isClickedAfterLock) {
        logger.debug('Mouse has left the window without a single click', { source: 'price-check' })
        hideWindow()
      }
    } else if (name === 'enter') {
      isMouseInside = true
      win.setIgnoreMouseEvents(false)

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
      y: 0,
      width: PoeWindow.bounds!.width - WIDTH,
      height: PoeWindow.bounds!.height
    })
    browserViewExternal.webContents.loadURL(link)
  })

  ipcMain.on(OPEN_LINK_EXTERNAL, (e, link) => {
    hideWindow()
    shell.openExternal(link)
  })

  ioHook.on('mousemove', (e: { x: number, y: number, ctrlKey?: boolean, shiftKey?: boolean }) => {
    const modifier = e.ctrlKey ? 'Ctrl' : e.shiftKey ? 'Shift' : undefined
    if (!isPollingClipboard && checkPressPosition && isWindowShown && !isWindowLocked && modifier !== config.get('priceCheckKeyHold')) {
      const mousePos = mousePosFromEvent(e)
      const distance = Math.hypot(mousePos.x - checkPressPosition.x, mousePos.y - checkPressPosition.y)

      logger.silly('Auto-hide mouse move', { source: 'price-check', distance, threshold: CLOSE_THRESHOLD_PX })
      if (distance > CLOSE_THRESHOLD_PX) {
        hideWindow()
      }
    } else if (priceCheckActualBounds && !isMouseInside) {
      const mousePos = mousePosFromEvent(e)

      if (
        mousePos.x > priceCheckActualBounds.x &&
        mousePos.x < priceCheckActualBounds.x + priceCheckActualBounds.width &&
        mousePos.y > priceCheckActualBounds.y &&
        mousePos.y < priceCheckActualBounds.y + priceCheckActualBounds.height
      ) {
        ipcMain.emit(PRICE_CHECK_MOUSE, undefined, 'enter', modifier)
      }
    }
  })
}

function positionWindow (tradeWindow: BrowserWindow) {
  const poeBounds = PoeWindow.bounds!

  priceCheckActualBounds = {
    x: getOffsetX(poeBounds),
    y: poeBounds.y,
    width: WIDTH,
    height: poeBounds.height
  }

  logger.debug('Reposition window', { source: 'price-check', poeBounds })
  tradeWindow.setBounds(poeBounds, false)
}

function getOffsetX (poePos: Rectangle): number {
  const mousePos = checkPressPosition!

  if (mousePos.x > (poePos.x + poePos.width / 2)) {
    // inventory
    return (poePos.x + poePos.width) - poeUserInterfaceWidth(poePos.height) - WIDTH
  } else {
    // stash or chat
    return poePos.x + poeUserInterfaceWidth(poePos.height)
  }
}

export function getPoeUiPosition (mousePos: Point) {
  if (mousePos.x > (PoeWindow.bounds!.x + PoeWindow.bounds!.width / 2)) {
    return 'inventory'
  } else {
    return 'stash' // or chat/vendor/center of screen
  }
}

export function poeUserInterfaceWidth (windowHeight: number) {
  // sidebar is 370px at 800x600
  const ratio = 370 / 600
  return Math.round(windowHeight * ratio)
}

function mousePosFromEvent (e: { x: number, y: number }): Point {
  if (process.platform === 'linux' && COUNT_DISPALYS > 1) {
    // ioHook returns mouse position that is not compatible with electron's position
    // when user has more than one monitor
    return screen.getCursorScreenPoint()
  } else {
    return e
  }
}
