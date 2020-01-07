import { BrowserWindow, screen, Rectangle } from 'electron'
import { keyTap } from 'robotjs'
import { windowManager } from 'node-window-manager'
import ioHook from 'iohook'
import { pollClipboard } from './PollClipboard'

export function setupShortcuts (win: BrowserWindow) {
  let IS_CHECKING = false
  ioHook.registerShortcut([29, 32], () => {
    if (!IS_CHECKING) {
      IS_CHECKING = true
      pollClipboard(32, 2000)
        .then(clipboard => {
          win.webContents.send('price-check', clipboard)
        })
        .catch(() => { /* nothing bad */ })
        .finally(() => { IS_CHECKING = false })
    }

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

    positionWindow(win)
  }, () => {
    // both keys released
  })

  const DEBUG_IO_HOOK = false
  ioHook.start(DEBUG_IO_HOOK)
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

    // step 2 - remove title space. Values taken on Windows 10. Also DPI may apply?
    if (!isWindowedFullscreen) {
      if (isMaximized) {
        poePos.y += 23
        poePos.height -= 23
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
