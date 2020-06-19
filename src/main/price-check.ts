import { ipcMain, Rectangle, Point } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { isPollingClipboard } from './shortcuts'
import { PoeWindow } from './PoeWindow'
import * as ipc from '@/ipc/ipc-event'
import { config } from './config'
import { logger } from './logger'
import { overlayWindow, isInteractable, assertOverlayActive, assertPoEActive, DPR } from './overlay-window'

const WIDTH_96DPI = 460
const CLOSE_THRESHOLD_96DPI = 40

let isPriceCheckShown = false
let isClickedAfterLock = false

let checkPressPosition: Point | undefined
let activeAreaRect: Rectangle | undefined
let isMouseInside = false

export function showWidget (opts: {
  clipboard: string
  hotkeyPressPosition: Point
  lockedMode: boolean
}) {
  checkPressPosition = opts.hotkeyPressPosition

  overlayWindow!.webContents.send(ipc.PRICE_CHECK, { clipboard: opts.clipboard, position: checkPressPosition } as ipc.IpcPriceCheck)

  const poeBounds = PoeWindow.bounds!
  activeAreaRect = {
    x: getOffsetX(checkPressPosition!, poeBounds),
    y: poeBounds.y,
    width: Math.floor(WIDTH_96DPI * DPR),
    height: poeBounds.height
  }

  isPriceCheckShown = true
  isClickedAfterLock = false
  isMouseInside = false

  if (opts.lockedMode) {
    lockWindow(true)
  }
}

export function lockWindow (syntheticClick = false) {
  logger.verbose('Disable auto-hide and focus window', { source: 'price-check', fn: 'lockWindow', syntheticClick })
  isClickedAfterLock = syntheticClick
  assertOverlayActive()
}

export function setupShowHide () {
  ipcMain.on(ipc.PRICE_CHECK_HIDE, () => {
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

  ipcMain.on(ipc.PRICE_CHECK_MOUSE, (e, name: string, modifier?: string) => {
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

  uIOhook.on('mousemove', (e) => {
    if (!isPriceCheckShown) return

    const modifier = e.ctrlKey ? 'Ctrl' : e.altKey ? 'Alt' : undefined
    if (!isPollingClipboard && !isInteractable && modifier !== config.get('priceCheckKeyHold')) {
      const mousePos = e
      const distance = Math.hypot(mousePos.x - checkPressPosition!.x, mousePos.y - checkPressPosition!.y)

      if (distance > (CLOSE_THRESHOLD_96DPI * DPR)) {
        logger.debug('Closing', { source: 'price-check', reason: 'Auto-hide on mouse move', distance, threshold: CLOSE_THRESHOLD_96DPI })
        overlayWindow!.webContents.send(ipc.PRICE_CHECK_CANCELED)
        isPriceCheckShown = false
      }
    } else if (!isMouseInside) {
      const mousePos = e

      if (
        mousePos.x > activeAreaRect!.x &&
        mousePos.x < activeAreaRect!.x + activeAreaRect!.width &&
        mousePos.y > activeAreaRect!.y &&
        mousePos.y < activeAreaRect!.y + activeAreaRect!.height
      ) {
        ipcMain.emit(ipc.PRICE_CHECK_MOUSE, undefined, 'enter', modifier)
      }
    }
  })
}

function getOffsetX (mousePos: Point, poePos: Rectangle): number {
  if (mousePos.x > (poePos.x + poePos.width / 2)) {
    // inventory
    return (poePos.x + poePos.width) - PoeWindow.uiSidebarWidth - Math.floor(WIDTH_96DPI * DPR)
  } else {
    // stash or chat
    return poePos.x + PoeWindow.uiSidebarWidth
  }
}
