import { screen, Point, clipboard } from 'electron'
import robotjs from 'robotjs'
import ioHook from 'iohook'
import { pollClipboard } from './PollClipboard'
import { win } from './window'
import { windowManager } from './window-manager'
import { showWindow, lockWindow, poeUserInterfaceWidth } from './positioning'

// const KEY_CTRL = 29
// const KEY_ALT = 56
const KEY_D = 32
const KEY_F5 = 63
const POE_TITLE = 'Path of Exile'

export let isPollingClipboard = false
export let checkPressPosition: Point | undefined
export let poeWindowId: number | null = null

export function setupShortcuts () {
  // A value of zero causes the thread to relinquish the remainder of its
  // time slice to any other thread that is ready to run. If there are no other
  // threads ready to run, the function returns immediately
  robotjs.setKeyboardDelay(0)

  ioHook.on('keydown', async (e: { keycode: number, ctrlKey: boolean, altKey: boolean }) => {
    if (e.keycode !== KEY_D || !e.ctrlKey || e.altKey) return

    if (!isPollingClipboard) {
      isPollingClipboard = true
      pollClipboard(32, 1000)
        .then(async (clipboard) => {
          win.webContents.send('price-check', clipboard)
          poeWindowId = await windowManager.getActiveWindowId()
          await showWindow()
        })
        .catch(() => { /* nothing bad */ })
        .finally(() => { isPollingClipboard = false })
    }
    checkPressPosition = screen.getCursorScreenPoint()

    // NOTE:
    // keyTap('key_c', -->> ['control'] <<--) must be never used
    // - this callback called on "keypress" not "keyup"
    // - ability to price multiple items with holded Ctrl, while variant above will change Ctrl key state to "up"
    robotjs.keyTap('key_c')
  })

  ioHook.on('keydown', async (e: { keycode: number, ctrlKey: boolean, altKey: boolean }) => {
    if (e.keycode !== KEY_D || !e.ctrlKey || !e.altKey) return

    if (!isPollingClipboard) {
      isPollingClipboard = true
      pollClipboard(32, 1000)
        .then(async (clipboard) => {
          win.webContents.send('price-check', clipboard)
          poeWindowId = await windowManager.getActiveWindowId()
          await showWindow()
          lockWindow(true)
        })
        .catch(() => { /* nothing bad */ })
        .finally(() => { isPollingClipboard = false })
    }
    checkPressPosition = screen.getCursorScreenPoint()

    robotjs.keyToggle('alt', 'up')
    robotjs.keyTap('key_c')
  })

  let naiveInventoryCheckX: number | undefined
  ioHook.on('mousewheel', async (e: { ctrlKey?: true, x: number, rotation: 1 | -1 }) => {
    if (!e.ctrlKey) return
    if (naiveInventoryCheckX === undefined) {
      if (await windowManager.getActiveWindowTitle() !== POE_TITLE) {
        return
      } else {
        // NOTE: will not be updated if window moved
        const poePos = await windowManager.getActiveWindowContentBounds()
        naiveInventoryCheckX = poePos!.x + poeUserInterfaceWidth(poePos!.height)
      }
    }

    const mouseX = (process.platform === 'linux') ? screen.getCursorScreenPoint().x : e.x
    if (mouseX > naiveInventoryCheckX) {
      if (e.rotation > 0) {
        robotjs.keyTap('right')
      } else if (e.rotation < 0) {
        robotjs.keyTap('left')
      }
    }
  })

  ioHook.registerShortcut([KEY_F5], () => { /* ignore keydown */ }, async () => {
    const title = await windowManager.getActiveWindowTitle()
    if (title === POE_TITLE) {
      typeChatCommand('/hideout')
    }
  })

  const DEBUG_IO_HOOK = false
  ioHook.start(DEBUG_IO_HOOK)
}

function typeChatCommand (command: string) {
  const saved = clipboard.readText()

  clipboard.writeText(command)
  robotjs.keyTap('enter')
  robotjs.keyTap('key_v', ['control'])
  robotjs.keyTap('enter')
  // restore the last chat
  robotjs.keyTap('enter')
  robotjs.keyTap('up')
  robotjs.keyTap('up')
  robotjs.keyTap('escape')

  setTimeout(() => {
    clipboard.writeText(saved)
  }, 100)
}
