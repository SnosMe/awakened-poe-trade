import { BrowserWindow, screen, Rectangle, ipcMain, Point } from 'electron'
import { keyTap } from 'robotjs'
import { windowManager } from 'node-window-manager'
import ioHook from 'iohook'
import { pollClipboard } from './PollClipboard'

const KEY_CTRL = 29
const KEY_D = 32

const CLOSE_THRESHOLD_PX = 40

let isPollingClipboard = false
let checkPressPosition: Point | undefined
let isCtrlDown = false

export function setupShortcuts (win: BrowserWindow) {
  ioHook.registerShortcut([KEY_CTRL, KEY_D], () => {
    if (!isPollingClipboard) {
      isPollingClipboard = true
      pollClipboard(32, 1750)
        .then(clipboard => {
          win.webContents.send('price-check', clipboard)
        })
        .catch(() => { /* nothing bad */ })
        .finally(() => { isPollingClipboard = false })
    }
    checkPressPosition = screen.getCursorScreenPoint()

    // NOTE:
    // keyTap('c', ['control']) must be never used
    // - this callback called on "keypress" not "keyup"
    // - ability to price multiple items with holded Ctrl, while variant above will change Ctrl key state to "up"
    // Known bugs:
    // - press Ctrl+D very very often, or just hold down Ctrl+D
    //   After releasing keys "Character Screen" will flesh ~times~
    //   Because Ctrl is released, but event loop still has events
    // Alternative impl:
    // - use Ctrl+C, as original XenoTrade does
    keyTap('c')
  }, () => {
    // both keys released
  })

  ioHook.on('mousemove', (e: { x: number, y: number }) => {
    if (!isPollingClipboard && checkPressPosition && !isCtrlDown) {
      const distance = Math.hypot(e.x - checkPressPosition.x, e.y - checkPressPosition.y)
      if (distance > CLOSE_THRESHOLD_PX) {
        checkPressPosition = undefined
        win.hide()
      }
    }
  })

  const DEBUG_IO_HOOK = false
  ioHook.start(DEBUG_IO_HOOK)
}

export function setupShowHide (win: BrowserWindow) {
  ipcMain.on('price-check-visible', (e, isVisible) => {
    if (isVisible) {
      positionWindow(win)
      win.showInactive()
      // setup listener mouse move
    } else {
      checkPressPosition = undefined
      win.hide()
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
