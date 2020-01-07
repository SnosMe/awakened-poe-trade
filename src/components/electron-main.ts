import { BrowserWindow } from 'electron'
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
  const poePos = poeWindow.getBounds()

  if (process.platform === 'win32') {
    // Interesting fact:
    //   some windows have `1px border` in focused state,
    //   so it would be 7px for them, but not PoE window
    const WINDOW_OFFSET = 8

    // if not windowed fullscreen
    if (poePos.y !== 0) {
      poePos.x! += WINDOW_OFFSET
      poePos.width! -= WINDOW_OFFSET * 2

      // if maximized
      if (poePos.y === -WINDOW_OFFSET) {
        poePos.y! += WINDOW_OFFSET
        poePos.height! -= WINDOW_OFFSET * 2
      } else {
        poePos.height! -= WINDOW_OFFSET
      }
    }
  }

  tradeWindow.setPosition(poePos.x!, poePos.y!, false)
}
