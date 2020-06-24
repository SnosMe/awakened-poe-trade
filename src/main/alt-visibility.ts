import { overlayWindow, isInteractable } from './overlay-window'
import { VISIBILITY, IpcVisibility } from '@/ipc/ipc-event'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { logger } from './logger'

let timerId: NodeJS.Timeout | undefined
let isOverlayVisible = true

export function setupAltVisibility () {
  uIOhook.on('keydown', (e) => {
    if (e.altKey && !e.shiftKey && !e.ctrlKey && e.keycode === UiohookKey.Alt) {
      makeInvisible()
    } else {
      makeVisible()
    }
  })

  uIOhook.on('keyup', (e) => {
    if (!e.altKey) { makeVisible() }
  })

  uIOhook.on('mousemove', (e) => {
    if (!e.altKey) { makeVisible() }
  })
}

function makeVisible () {
  if (isOverlayVisible && timerId === undefined) return

  if (timerId !== undefined) {
    logger.debug('Invisibility delay canceled', { source: 'alt-visibility' })
    clearTimeout(timerId)
    timerId = undefined
  } else {
    logger.debug('Making visible again', { source: 'alt-visibility' })
    isOverlayVisible = true
    overlayWindow!.webContents.send(VISIBILITY, { isVisible: isOverlayVisible } as IpcVisibility)
  }
}

function makeInvisible () {
  if (!isOverlayVisible || timerId !== undefined) return

  logger.debug('Starting delay before invisible UI', { source: 'alt-visibility' })
  timerId = setTimeout(() => {
    logger.debug('Delay passed, overlay is invisible', { source: 'alt-visibility' })
    timerId = undefined
    isOverlayVisible = false
    overlayWindow!.webContents.send(VISIBILITY, { isVisible: isOverlayVisible } as IpcVisibility)
  }, isInteractable ? 85 : 275)
}
