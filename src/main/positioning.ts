import { ipcMain, screen, Rectangle, BrowserView, Point, app, shell } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { checkPressPosition, isPollingClipboard } from './shortcuts'
import { PoeWindow } from './PoeWindow'
import { PRICE_CHECK_HIDE, PRICE_CHECK_MOUSE, OPEN_LINK, OPEN_LINK_EXTERNAL, PRICE_CHECK_CANCELED } from '@/ipc/ipc-event'
import { config } from './config'
import { logger } from './logger'
import { overlayWindow, isInteractable, assertOverlayActive, assertPoEActive } from './overlay-window'

const WIDTH = 460
const CLOSE_THRESHOLD_PX = 40

let isPriceCheckShown = false
let isClickedAfterLock = false

let activeAreaRect: Rectangle | undefined
let isMouseInside = false

let browserViewExternal: BrowserView | undefined

let DISPLAY_SCALED = false
app.on('ready', () => {
  const displays = screen.getAllDisplays()
  DISPLAY_SCALED = displays.some(display => display.scaleFactor !== 1)
})

export function showWindow () {
  const poeBounds = PoeWindow.bounds!
  activeAreaRect = {
    x: getOffsetX(checkPressPosition!, poeBounds),
    y: poeBounds.y,
    width: WIDTH,
    height: poeBounds.height
  }

  isPriceCheckShown = true
  isClickedAfterLock = false
  isMouseInside = false
}

function hideWindow () {
  isPriceCheckShown = false
  isMouseInside = false
  activeAreaRect = undefined

  if (isInteractable) {
    if (browserViewExternal) {
      overlayWindow!.removeBrowserView(browserViewExternal)
      // uncomment to trade performance for less memory usage (1 process & 13 MB)
      // browserViewExternal.destroy()
      // browserViewExternal = undefined
      browserViewExternal.webContents.loadURL('about:blank')
    }
  }
}

export function lockWindow (syntheticClick = false) {
  logger.verbose('Disable auto-hide and focus window', { source: 'price-check', fn: 'lockWindow', syntheticClick })
  isClickedAfterLock = syntheticClick
  assertOverlayActive()
}

export function setupShowHide () {
  ipcMain.on(PRICE_CHECK_HIDE, () => {
    logger.debug('Closing', { source: 'price-check', reason: 'Close button or hotkey' })
    isPriceCheckShown = false
    assertPoEActive()
  })

  PoeWindow.on('active-change', (isActive) => {
    if (isActive && isInteractable) {
      logger.debug('Closing', { source: 'price-check', reason: 'PoE is focused' })
      isPriceCheckShown = false
    }
  })

  ipcMain.on(PRICE_CHECK_MOUSE, (e, name: string, modifier?: string) => {
    if (name === 'click') {
      isClickedAfterLock = true
      logger.debug('Clicked inside window after lock', { source: 'price-check' })
    } else if (name === 'leave') {
      isMouseInside = false

      if (!isClickedAfterLock) {
        logger.debug('Closing', { source: 'price-check', reason: 'Mouse has left the window without a single click' })
        isPriceCheckShown = false
        assertPoEActive()
      }
    } else if (name === 'enter') {
      isMouseInside = true

      if (isInteractable) return

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

    overlayWindow!.setBrowserView(browserViewExternal)
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

  uIOhook.on('mousemove', (e) => {
    if (!isPriceCheckShown) return

    const modifier = e.ctrlKey ? 'Ctrl' : e.altKey ? 'Alt' : undefined
    if (!isPollingClipboard && !isInteractable && modifier !== config.get('priceCheckKeyHold')) {
      const mousePos = mousePosFromEvent(e)
      const distance = Math.hypot(mousePos.x - checkPressPosition!.x, mousePos.y - checkPressPosition!.y)

      if (distance > CLOSE_THRESHOLD_PX) {
        logger.debug('Closing', { source: 'price-check', reason: 'Auto-hide on mouse move', distance, threshold: CLOSE_THRESHOLD_PX })
        overlayWindow!.webContents.send(PRICE_CHECK_CANCELED)
        isPriceCheckShown = false
      }
    } else if (!isMouseInside) {
      const mousePos = mousePosFromEvent(e)

      if (
        mousePos.x > activeAreaRect!.x &&
        mousePos.x < activeAreaRect!.x + activeAreaRect!.width &&
        mousePos.y > activeAreaRect!.y &&
        mousePos.y < activeAreaRect!.y + activeAreaRect!.height
      ) {
        ipcMain.emit(PRICE_CHECK_MOUSE, undefined, 'enter', modifier)
      }
    }
  })
}

function getOffsetX (mousePos: Point, poePos: Rectangle): number {
  if (mousePos.x > (poePos.x + poePos.width / 2)) {
    // inventory
    return (poePos.x + poePos.width) - PoeWindow.uiSidebarWidth - WIDTH
  } else {
    // stash or chat
    return poePos.x + PoeWindow.uiSidebarWidth
  }
}

export function mousePosFromEvent (e: { x: number, y: number }): Point {
  if (DISPLAY_SCALED) {
    return screen.getCursorScreenPoint()
  } else {
    return e
  }
}
