import { BrowserWindow, ipcMain, screen, Rectangle } from 'electron'
import { windowManager } from 'node-window-manager'
import ioHook from 'iohook'
import { win } from './window'
import { checkPressPosition, isPollingClipboard } from './shortcuts'

const CLOSE_THRESHOLD_PX = 40

let isCtrlDown = false
let isWindowShown = true

export function setupShowHide () {
  ipcMain.on('price-check-visible', (e, isVisible) => {
    if (isVisible) {
      positionWindow(win)
      isWindowShown = true
      win.showInactive()
    } else {
      isWindowShown = false
      win.hide()
    }
  })

  ioHook.on('mousemove', (e: { x: number, y: number }) => {
    if (!isPollingClipboard && checkPressPosition && isWindowShown && !isCtrlDown) {
      const distance = Math.hypot(e.x - checkPressPosition.x, e.y - checkPressPosition.y)
      if (distance > CLOSE_THRESHOLD_PX) {
        isWindowShown = false
        win.hide()
      }
    }
  })
}

function positionWindow (tradeWindow: BrowserWindow) {
  const poeWindow = windowManager.getActiveWindow()
  const poePos = poeWindow.getBounds() as Rectangle
  console.assert(poePos.x != null && poePos.y != null && poePos.width != null && poePos.height != null)

  if (process.platform === 'win32') {
    // Interesting fact:
    //   some windows have `1px border` in focused state,
    //   so it would be 7px for them, but not PoE window
    const WINDOW_OFFSET = 8

    const isWindowedFullscreen = (poePos.y === 0)
    const isMaximized = !isWindowedFullscreen && (poePos.y === -WINDOW_OFFSET)

    if (!isWindowedFullscreen) {
      poePos.x += WINDOW_OFFSET
      poePos.width! -= WINDOW_OFFSET * 2

      if (isMaximized) {
        poePos.y += WINDOW_OFFSET
        poePos.height -= WINDOW_OFFSET * 2
      } else {
        poePos.height -= WINDOW_OFFSET
      }
    }

    // step 2 - remove title space. 32px taken on Windows 10. Also DPI may apply?
    if (!isWindowedFullscreen) {
      if (isMaximized) {
        poePos.y += (32 - WINDOW_OFFSET)
        poePos.height -= (32 - WINDOW_OFFSET)
      } else {
        poePos.y += 32
        poePos.height -= 32
      }
    }
  }

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

function poeUserInterfaceWidth (windowHeight: number) {
  // sidebar is 370px at 800x600
  const ratio = 370 / 600
  return Math.round(windowHeight * ratio)
}
