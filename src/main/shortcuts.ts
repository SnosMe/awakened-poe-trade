import { screen, Point, clipboard } from 'electron'
import robotjs from 'robotjs'
import ioHook from 'iohook'
import { pollClipboard } from './PollClipboard'
import { win } from './window'
import { showWindow, lockWindow, poeUserInterfaceWidth } from './positioning'
import { KeyCodeToName } from '@/components/settings/KeyToCode'
import { config } from './config'
import { PoeWindow } from './PoeWindow'
import { openWiki } from './wiki'

export let isPollingClipboard = false
export let checkPressPosition: Point | undefined

function priceCheck (lockedMode: boolean) {
  if (!isPollingClipboard) {
    isPollingClipboard = true
    pollClipboard(32, 500)
      .then(async (clipboard) => {
        win.webContents.send('price-check', clipboard)
        await showWindow()
        if (lockedMode) {
          lockWindow(true)
        }
      })
      .catch(() => { /* nothing bad */ })
      .finally(() => { isPollingClipboard = false })
  }
  checkPressPosition = screen.getCursorScreenPoint()

  if (!lockedMode) {
    if (config.get('priceCheckKeyHold') === 'Ctrl') {
      robotjs.keyTap('key_c')
    } else {
      robotjs.keyTap('key_c', ['control'])
    }
  } else {
    if (config.get('priceCheckLocked').includes('Alt')) {
      robotjs.keyToggle('alt', 'up')
    }
    robotjs.keyTap('key_c', ['control'])
  }
}

export function setupShortcuts () {
  // A value of zero causes the thread to relinquish the remainder of its
  // time slice to any other thread that is ready to run. If there are no other
  // threads ready to run, the function returns immediately
  robotjs.setKeyboardDelay(0)

  ioHook.on('keydown', async (e: any) => {
    if (!PoeWindow.isActive) {
      return
    }

    const pressed = eventToString(e)
    // console.log(pressed)

    if (pressed === `${config.get('priceCheckKeyHold')} + ${config.get('priceCheckKey')}`) {
      priceCheck(false)
    } else if (pressed === config.get('priceCheckLocked')) {
      priceCheck(true)
    } else if (pressed === config.get('wikiKey')) {
      pollClipboard(32, 500).then(openWiki).catch(() => {})
      robotjs.keyTap('key_c', ['control'])
    } else {
      const command = config.get('commands').find(c => c.hotkey === pressed)
      if (command) {
        typeChatCommand(command.text)
      }
    }
  })

  let naiveInventoryCheckX: number | undefined
  ioHook.on('mousewheel', async (e: { ctrlKey?: true, x: number, rotation: 1 | -1 }) => {
    if (!e.ctrlKey) return
    if (naiveInventoryCheckX === undefined) {
      if (!PoeWindow.bounds) {
        return
      } else {
        naiveInventoryCheckX = PoeWindow.bounds.x + poeUserInterfaceWidth(PoeWindow.bounds.height)
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

function eventToString (e: { rawcode: number, ctrlKey: boolean, altKey: boolean, shiftKey: boolean }) {
  let { ctrlKey, shiftKey, altKey } = e

  let code = KeyCodeToName[e.rawcode]
  if (!code) return 'unknown'

  if (shiftKey && altKey) code = `Shift + Alt + ${code}`
  else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`
  else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`
  else if (altKey) code = `Alt + ${code}`
  else if (ctrlKey) code = `Ctrl + ${code}`
  else if (shiftKey) code = `Shift + ${code}`

  return code
}
