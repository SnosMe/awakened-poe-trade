import { screen, Point, clipboard, globalShortcut, Notification, ipcMain } from 'electron'
import robotjs from 'robotjs'
import { uIOhook, UiohookKey, UiohookWheelEvent } from 'uiohook-napi'
import { pollClipboard } from './poll-clipboard'
import { showWidget as showPriceCheck } from './price-check'
import { KeyToElectron, mergeTwoHotkeys } from '@/ipc/KeyToCode'
import { config } from './config'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import { toggleOverlayState, overlayWindow, assertOverlayActive, assertPoEActive } from './overlay-window'
import * as ipc from '@/ipc/ipc-event'
import { typeInChat } from './game-chat'
import { gameConfig } from './game-config'

export let hotkeyPressPosition: Point | undefined

export const UiohookToName = Object.fromEntries(Object.entries(UiohookKey).map(([k, v]) => ([v, k])))

function priceCheck (lockedMode: boolean) {
  logger.info('Price check', { source: 'shortcuts', lockedMode })

  pollClipboard()
    .then(clipboard =>
      showPriceCheck({ clipboard, hotkeyPressPosition: hotkeyPressPosition!, lockedMode })
    )
    .catch(() => { /* nothing bad */ })
  hotkeyPressPosition = screen.getCursorScreenPoint()
  // if (process.platform === 'win32') {
  //   hotkeyPressPosition = screen.dipToScreenPoint(hotkeyPressPosition)
  // }

  if (!lockedMode) {
    pressKeysToCopyItemText(config.get('priceCheckKeyHold'))
  } else {
    pressKeysToCopyItemText()
    }
}

function pressKeysToCopyItemText (skipModKey?: string) {
  let keys = mergeTwoHotkeys('Ctrl + C', gameConfig?.highlightKey || 'Alt').split(' + ')
  keys = keys.filter(key => key !== 'C')
  if (skipModKey) {
    keys = keys.filter(key => key !== skipModKey)
  }

  for (const key of keys) {
    robotjs.keyToggle(key, 'down')
  }

  // finally press `C` to copy text
  robotjs.keyTap('C')

  keys.reverse()
  for (const key of keys) {
    robotjs.keyToggle(key, 'up')
  }
}

function itemCheck () {
  logger.info('Item check', { source: 'shortcuts' })

  pollClipboard()
    .then(clipboard => {
      overlayWindow!.webContents.send(ipc.ITEM_CHECK, { clipboard, position: hotkeyPressPosition! } as ipc.IpcItemCheck)
      assertOverlayActive()
    })
    .catch(() => {})
  hotkeyPressPosition = screen.getCursorScreenPoint()
  pressKeysToCopyItemText()
}

function registerGlobal () {
  const register = [
    shortcutCallback(
      config.get('priceCheckKey') && `${config.get('priceCheckKeyHold')} + ${config.get('priceCheckKey')}`,
      () => priceCheck(false),
      { doNotResetModKey: true }
    ),
    shortcutCallback(
      config.get('priceCheckLocked'),
      () => priceCheck(true)
    ),
    shortcutCallback(
      config.get('overlayKey'),
      toggleOverlayState,
      { doNotResetModKey: true }
    ),
    shortcutCallback(
      config.get('wikiKey'),
      () => {
        pollClipboard().then(openWiki).catch(() => {})
        pressKeysToCopyItemText()
      }
    ),
    shortcutCallback(
      config.get('craftOfExileKey'),
      () => {
        pollClipboard().then(openCraftOfExile).catch(() => {})
        pressKeysToCopyItemText()
      }
    ),
    shortcutCallback(
      config.get('itemCheckKey'),
      itemCheck
    ),
    shortcutCallback(
      config.get('delveGridKey'),
      toggleDelveGrid,
      { doNotResetModKey: true }
    ),
    ...config.get('commands')
      .map(command =>
        shortcutCallback(command.hotkey, () => typeInChat(command.text, command.send))
      )
  ].filter(a => Boolean(a.shortcut))

  register.forEach(a => {
    const success = globalShortcut.register(shortcutToElectron(a.shortcut!), a.cb)
    if (!success) {
      logger.error('Cannot register shortcut, because it is already registered by another application.', { source: 'shortcuts', shortcut: a.shortcut })

      new Notification({
        title: 'Awakened PoE Trade',
        body: `Cannot register shortcut ${a.shortcut}, because it is already registered by another application.`
      }).show()
    }
  })

  logger.verbose('Registered Global', { source: 'shortcuts', total: register.length })
}

function unregisterGlobal () {
  globalShortcut.unregisterAll()
  logger.verbose('Unregistered Global', { source: 'shortcuts' })
}

export function setupShortcuts () {
  // A value of zero causes the thread to relinquish the remainder of its
  // time slice to any other thread that is ready to run. If there are no other
  // threads ready to run, the function returns immediately
  robotjs.setKeyboardDelay(0)

  if (PoeWindow.isActive && config.get('useOsGlobalShortcut')) {
    registerGlobal()
  }
  PoeWindow.on('active-change', (isActive) => {
    if (config.get('useOsGlobalShortcut')) {
      process.nextTick(() => {
        if (isActive === PoeWindow.isActive) {
          if (isActive) {
            registerGlobal()
          } else {
            unregisterGlobal()
          }
        }
      })
    }
  })

  ipcMain.on(ipc.STASH_SEARCH, (e, opts: ipc.IpcStashSearch) => { stashSearch(opts.text) })

  uIOhook.on('keydown', (e) => {
    const pressed = eventToString(e)
    logger.debug('Keydown', { source: 'shortcuts', keys: pressed })

    if (!PoeWindow.isActive || config.get('useOsGlobalShortcut')) return

    if (pressed === `${config.get('priceCheckKeyHold')} + ${config.get('priceCheckKey')}`) {
      shortcutCallback(pressed, () => {
        priceCheck(false)
      }, { doNotResetModKey: true }).cb()
    } else if (pressed === config.get('priceCheckLocked')) {
      shortcutCallback(pressed, () => {
        priceCheck(true)
      }).cb()
    } else if (pressed === config.get('overlayKey')) {
      shortcutCallback(pressed, toggleOverlayState, { doNotResetModKey: true }).cb()
    } else if (pressed === config.get('wikiKey')) {
      shortcutCallback(pressed, () => {
        pollClipboard().then(openWiki).catch(() => {})
        pressKeysToCopyItemText()
      }).cb()
    } else if (pressed === config.get('craftOfExileKey')) {
      shortcutCallback(pressed, () => {
        pollClipboard().then(openCraftOfExile).catch(() => {})
        pressKeysToCopyItemText()
      }).cb()
    } else if (pressed === config.get('itemCheckKey')) {
      shortcutCallback(pressed, itemCheck).cb()
    } else if (pressed === config.get('delveGridKey')) {
      shortcutCallback(pressed, toggleDelveGrid, { doNotResetModKey: true }).cb()
    } else {
      const command = config.get('commands').find(c => c.hotkey === pressed)
      if (command) {
        shortcutCallback(pressed, () => {
          typeInChat(command.text, command.send)
        }).cb()
      }
    }
  })

  uIOhook.on('keyup', (e) => {
    logger.debug('Keyup', { source: 'shortcuts', key: UiohookToName[e.keycode] || 'unknown' })
  })

  uIOhook.on('wheel', (e) => {
    if (!e.ctrlKey || !PoeWindow.bounds || !PoeWindow.isActive || !config.get('stashScroll')) return

    if (!isGameScrolling(e)) {
      if (e.rotation > 0) {
        robotjs.keyTap('ArrowRight')
      } else if (e.rotation < 0) {
        robotjs.keyTap('ArrowLeft')
      }
    }
  })

  uIOhook.start()
}

function isGameScrolling (mouse: UiohookWheelEvent): boolean {
  if (!PoeWindow.bounds ||
      mouse.x > (PoeWindow.bounds.x + PoeWindow.uiSidebarWidth)) return false

  return (mouse.y > (PoeWindow.bounds.y + PoeWindow.bounds.height * 154 / 1600) &&
          mouse.y < (PoeWindow.bounds.y + PoeWindow.bounds.height * 1192 / 1600))
}

function stashSearch (text: string) {
  const saved = clipboard.readText()

  assertPoEActive()
  clipboard.writeText(text)
  robotjs.keyTap('F', ['Ctrl'])
  robotjs.keyTap('V', ['Ctrl'])
  robotjs.keyTap('Enter')

  if (config.get('restoreClipboard')) {
    setTimeout(() => {
      clipboard.writeText(saved)
    }, 120)
  }
}

function openWiki (clipboard: string) {
  overlayWindow!.webContents.send(ipc.OPEN_WIKI, clipboard)
}

function openCraftOfExile (clipboard: string) {
  overlayWindow!.webContents.send(ipc.OPEN_COE, clipboard)
}

function toggleDelveGrid () {
  overlayWindow!.webContents.send(ipc.TOGGLE_DELVE_GRID)
}

function eventToString (e: { keycode: number, ctrlKey: boolean, altKey: boolean, shiftKey: boolean }) {
  const { ctrlKey, shiftKey, altKey } = e

  let code = UiohookToName[e.keycode]
  if (!code) return 'unknown'

  if (code === 'Shift' || code === 'Alt' || code === 'Ctrl') return code

  if (shiftKey && altKey) code = `Shift + Alt + ${code}`
  else if (ctrlKey && shiftKey) code = `Ctrl + Shift + ${code}`
  else if (ctrlKey && altKey) code = `Ctrl + Alt + ${code}`
  else if (altKey) code = `Alt + ${code}`
  else if (ctrlKey) code = `Ctrl + ${code}`
  else if (shiftKey) code = `Shift + ${code}`

  return code
}

function shortcutCallback<T extends Function> (shortcut: string | null, cb: T, opts?: { doNotResetModKey?: boolean }) {
  return {
    shortcut,
    cb: function () {
      if (!shortcut) throw new Error('Never: callback called on null shortcut')

      if (opts?.doNotResetModKey) {
        const nonModKey = shortcut.split(' + ').reverse()[0]
        robotjs.keyToggle(nonModKey, 'up')
      } else {
        shortcut.split(' + ').reverse().forEach(key => { robotjs.keyToggle(key, 'up') })
      }
      cb()
    }
  }
}

function shortcutToElectron (shortcut: string) {
  return shortcut
    .split(' + ')
    .map(k => KeyToElectron[k as keyof typeof KeyToElectron])
    .join('+')
}
