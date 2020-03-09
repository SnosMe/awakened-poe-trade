import { screen, Point, clipboard, globalShortcut, Notification } from 'electron'
import robotjs from 'robotjs'
import ioHook from 'iohook'
import { pollClipboard } from './PollClipboard'
import { win } from './window'
import { showWindow, lockWindow, poeUserInterfaceWidth } from './positioning'
import { KeyCodeToName, KeyToElectron } from '@/components/settings/KeyToCode'
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
    if (config.get('priceCheckLocked')!.includes('Alt')) {
      robotjs.keyToggle('alt', 'up')
    }
    robotjs.keyTap('key_c', ['control'])
  }
}

function registerGlobal () {
  const register = [
    {
      accelerator: `${config.get('priceCheckKeyHold')} + ${config.get('priceCheckKey')}`,
      cb: () => priceCheck(false)
    }, {
      accelerator: config.get('priceCheckLocked'),
      cb: () => priceCheck(true)
    }, {
      accelerator: config.get('wikiKey'),
      cb: () => {
        pollClipboard(32, 500).then(openWiki).catch(() => {})
        robotjs.keyTap('key_c', ['control'])
      }
    },
    ...config.get('commands')
      .map(command => ({
        accelerator: command.hotkey,
        cb: () => typeChatCommand(command.text)
      }))
  ].filter(a => Boolean(a.accelerator))

  register.forEach(a => {
    const success = globalShortcut.register(shortcutToElectron(a.accelerator!), a.cb)
    if (!success) {
      new Notification({
        title: 'Awakened PoE Trade',
        body: `Cannot register shortcut ${a.accelerator}, because it is already registered by another application.`
      }).show()
    }
  })
}

function unregisterGlobal () {
  globalShortcut.unregisterAll()
}

export function setupShortcuts () {
  // A value of zero causes the thread to relinquish the remainder of its
  // time slice to any other thread that is ready to run. If there are no other
  // threads ready to run, the function returns immediately
  robotjs.setKeyboardDelay(0)

  if (PoeWindow.isActive) {
    registerGlobal()
  }
  PoeWindow.addListener('active-change', (isActive) => {
    if (isActive) {
      registerGlobal()
    } else {
      unregisterGlobal()
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
  const { ctrlKey, shiftKey, altKey } = e

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

function shortcutToElectron (shortcut: string) {
  return shortcut
    .split(' + ')
    .map(k => KeyToElectron[k as keyof typeof KeyToElectron])
    .join('+')
}
