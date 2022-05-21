import { Rectangle, Point, screen } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { isPollingClipboard } from './poll-clipboard'
import { PoeWindow } from './PoeWindow'
import { config } from './config'
import { logger } from './logger'
import { isInteractable, assertOverlayActive, assertPoEActive, DPR, overlayOnEvent, overlaySendEvent } from './overlay-window'
import type { PriceCheckWidget } from '../../ipc/widgets'

const WIDTH_96DPI = 460 / 16
const CLOSE_THRESHOLD_96DPI = 40 / 16

let isPriceCheckShown = false
let isClickedAfterLock = false

let checkPressPosition: Point | undefined
let activeAreaRect: Rectangle | undefined
let isMouseInside = false

export function showWidget (opts: {
  clipboard: string
  pressPosition: Point
  eventName: string
}) {
  checkPressPosition = (process.platform === 'win32')
    ? screen.dipToScreenPoint(opts.pressPosition)
    : opts.pressPosition
  const isLokedMode = (opts.eventName === 'price-check-locked')

  overlaySendEvent({
    name: 'MAIN->OVERLAY::price-check',
    payload: { clipboard: opts.clipboard, position: opts.pressPosition, lockedMode: isLokedMode }
  })

  const poeBounds = PoeWindow.bounds
  activeAreaRect = {
    x: getOffsetX(checkPressPosition, poeBounds),
    y: poeBounds.y,
    width: Math.floor(WIDTH_96DPI * DPR * config.get('fontSize')),
    height: poeBounds.height
  }

  isPriceCheckShown = true
  isClickedAfterLock = false
  isMouseInside = false

  if (isLokedMode) {
    lockWindow(true)
  }
}

export function lockWindow (syntheticClick = false) {
  logger.debug('Disable auto-hide and focus window', { source: 'price-check', fn: 'lockWindow', syntheticClick })
  isClickedAfterLock = syntheticClick
  assertOverlayActive()
}

export function setupShowHide () {
  overlayOnEvent('OVERLAY->MAIN::price-check-hide', () => {
    if (isPriceCheckShown) {
      logger.debug('Closing', { source: 'price-check', reason: 'Event from widget' })
      isPriceCheckShown = false
    }
  })

  uIOhook.on('mousemove', (e) => {
    if (!isPriceCheckShown || isClickedAfterLock) return

    const modifier = e.ctrlKey ? 'Ctrl' : e.altKey ? 'Alt' : undefined
    if (!isPollingClipboard && !isInteractable && modifier !== priceCheckConfig().hotkeyHold) {
      const distance = Math.hypot(e.x - checkPressPosition!.x, e.y - checkPressPosition!.y)

      if (distance > (CLOSE_THRESHOLD_96DPI * DPR * config.get('fontSize'))) {
        logger.debug('Closing', { source: 'price-check', reason: 'Auto-hide on mouse move', distance, threshold: CLOSE_THRESHOLD_96DPI })
        overlaySendEvent({ name: 'MAIN->OVERLAY::price-check-canceled', payload: undefined })
        isPriceCheckShown = false
      }
    } else if (!isMouseInside) {
      if (isPointInsideRect(e, activeAreaRect!)) {
        handleMouseEvent('enter', modifier)
      }
    } else if (isMouseInside) {
      if (!isPointInsideRect(e, activeAreaRect!)) {
        handleMouseEvent('leave')
      }
    }
  })

  uIOhook.on('mousedown', () => {
    if (isPriceCheckShown && !isClickedAfterLock && isMouseInside) {
      handleMouseEvent('click')
    }
  })
}

function handleMouseEvent (name: string, modifier?: string) {
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

    if (modifier === priceCheckConfig().hotkeyHold) {
      lockWindow()
    } else {
      logger.debug('Not locking window, the key is not held', { source: 'price-check' })
    }
  }
}

function isPointInsideRect (point: Point, rect: Rectangle) {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  )
}

function getOffsetX (mousePos: Point, poePos: Rectangle): number {
  if (mousePos.x > (poePos.x + poePos.width / 2)) {
    // inventory
    return (poePos.x + poePos.width) - PoeWindow.uiSidebarWidth - Math.floor(WIDTH_96DPI * DPR * config.get('fontSize'))
  } else {
    // stash or chat
    return poePos.x + PoeWindow.uiSidebarWidth
  }
}

export function priceCheckConfig () {
  return config.get('widgets')
    .find(widget => widget.wmType === 'price-check') as PriceCheckWidget
}
