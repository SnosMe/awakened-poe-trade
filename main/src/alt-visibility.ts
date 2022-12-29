import { isInteractable, overlaySendEvent } from './overlay-window'
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
    logger.debug('取消隐形延迟', { source: 'alt-visibility' })
    clearTimeout(timerId)
    timerId = undefined
  } else {
    logger.debug('使其再次可见', { source: 'alt-visibility' })
    isOverlayVisible = true
    overlaySendEvent({
      name: 'MAIN->OVERLAY::visibility',
      payload: { isVisible: isOverlayVisible }
    })
  }
}

function makeInvisible () {
  if (!isOverlayVisible || timerId !== undefined) return

  logger.debug('不可见UI之前的启动延迟', { source: 'alt-visibility' })
  timerId = setTimeout(() => {
    logger.debug('延迟已过，覆盖不可见', { source: 'alt-visibility' })
    timerId = undefined
    isOverlayVisible = false
    overlaySendEvent({
      name: 'MAIN->OVERLAY::visibility',
      payload: { isVisible: isOverlayVisible }
    })
  }, isInteractable ? 85 : 275)
}
