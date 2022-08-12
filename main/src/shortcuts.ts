import { screen, globalShortcut } from 'electron'
import { uIOhook, UiohookKey, UiohookWheelEvent } from 'uiohook-napi'
import { pollClipboard } from './poll-clipboard'
import { priceCheckConfig, showWidget as showPriceCheck } from './price-check'
import { isModKey, KeyToElectron, mergeTwoHotkeys } from '../../ipc/KeyToCode'
import { config } from './config'
import { PoeWindow } from './PoeWindow'
import { logger } from './logger'
import { toggleOverlayState, assertOverlayActive, assertPoEActive, overlayOnEvent, overlaySendEvent } from './overlay-window'
import type * as ipc from '../../ipc/ipc-event'
import type * as widget from '../../ipc/widgets'
import { typeInChat } from './game-chat'
import { gameConfig } from './game-config'
import { restoreClipboard } from './clipboard-saver'

type UiohookKeyT = keyof typeof UiohookKey
export const UiohookToName = Object.fromEntries(Object.entries(UiohookKey).map(([k, v]) => ([v, k])))

export interface ShortcutAction {
  shortcut: string
  keepModKeys?: true
  action: {
    type: 'copy-item'
    eventName: (
      ipc.IpcOpenWiki['name'] |
      ipc.IpcOpenCraftOfExile['name'] |
      ipc.IpcItemCheck['name'] |
      'price-check-quick' |
      'price-check-locked'
    )
    focusOverlay?: boolean
  } | ({
    type: 'trigger-event'
  } & (
    ShortcutActionTriggerEvent<ipc.IpcToggleDelveGrid['name']> |
    ShortcutActionTriggerEvent<ipc.IpcStopwatchAction['name']>
  )) | {
    type: 'stash-search'
    text: string
  } | {
    type: 'toggle-overlay'
  } | {
    type: 'paste-in-chat'
    text: string
    send: boolean
  } | {
    type: 'test-only'
  }
}

interface ShortcutActionTriggerEvent<Name extends ipc.IpcEvent['name']> {
  eventName: Name
  payload: ipc.IpcEventPayload<Name>
}

function shortcutsFromConfig () {
  let actions: ShortcutAction[] = []

  const priceCheckCfg = priceCheckConfig()
  if (priceCheckCfg.hotkey) {
    actions.push({
      shortcut: `${priceCheckCfg.hotkeyHold} + ${priceCheckCfg.hotkey}`,
      action: { type: 'copy-item', eventName: 'price-check-quick' },
      keepModKeys: true
    })
  }
  if (priceCheckCfg.hotkeyLocked) {
    actions.push({
      shortcut: priceCheckCfg.hotkeyLocked,
      action: { type: 'copy-item', eventName: 'price-check-locked' }
    })
  }
  actions.push({
    shortcut: config.get('overlayKey'),
    action: { type: 'toggle-overlay' },
    keepModKeys: true
  })
  if (config.get('wikiKey')) {
    actions.push({
      shortcut: config.get('wikiKey')!,
      action: { type: 'copy-item', eventName: 'MAIN->OVERLAY::open-wiki' }
    })
  }
  if (config.get('craftOfExileKey')) {
    actions.push({
      shortcut: config.get('craftOfExileKey')!,
      action: { type: 'copy-item', eventName: 'MAIN->OVERLAY::open-craft-of-exile' }
    })
  }
  if (config.get('itemCheckKey')) {
    actions.push({
      shortcut: config.get('itemCheckKey')!,
      action: { type: 'copy-item', eventName: 'MAIN->OVERLAY::item-check', focusOverlay: true }
    })
  }
  if (config.get('delveGridKey')) {
    actions.push({
      shortcut: config.get('delveGridKey')!,
      action: { type: 'trigger-event', eventName: 'MAIN->OVERLAY::delve-grid', payload: undefined },
      keepModKeys: true
    })
  }
  for (const command of config.get('commands')) {
    if (command.hotkey) {
      actions.push({
        shortcut: command.hotkey,
        action: { type: 'paste-in-chat', text: command.text, send: command.send }
      })
    }
  }
  const copyItemShortcut = mergeTwoHotkeys('Ctrl + C', gameConfig?.highlightKey || 'Alt')
  if (copyItemShortcut !== 'Ctrl + C') {
    actions.push({
      shortcut: copyItemShortcut,
      action: { type: 'test-only' }
    })
  }
  for (const widget of config.get('widgets')) {
    if (widget.wmType === 'stash-search') {
      const stashSearch = widget as widget.StashSearchWidget
      for (const entry of stashSearch.entries) {
        if (entry.hotkey) {
          actions.push({
            shortcut: entry.hotkey,
            action: { type: 'stash-search', text: entry.text }
          })
        }
      }
    } else if (widget.wmType === 'timer') {
      const stopwatch = widget as widget.StopwatchWidget
      if (stopwatch.toggleKey) {
        actions.push({
          shortcut: stopwatch.toggleKey,
          keepModKeys: true,
          action: {
            type: 'trigger-event',
            eventName: 'MAIN->OVERLAY::stopwatch',
            payload: { wmId: widget.wmId, type: 'start-stop' }
          }
        })
      }
      if (stopwatch.resetKey) {
        actions.push({
          shortcut: stopwatch.resetKey,
          keepModKeys: true,
          action: {
            type: 'trigger-event',
            eventName: 'MAIN->OVERLAY::stopwatch',
            payload: { wmId: widget.wmId, type: 'reset' }
          }
        })
      }
    }
  }

  {
    const allShortcuts = new Set([
      'Ctrl + C', 'Ctrl + V', 'Ctrl + A',
      'Ctrl + F',
      'Ctrl + Enter',
      'Home', 'Delete', 'Enter',
      'ArrowUp', 'ArrowRight', 'ArrowLeft',
      copyItemShortcut
    ])

    for (const action of actions) {
      if (allShortcuts.has(action.shortcut) && action.action.type !== 'test-only') {
        logger.error('Hotkey reserved by the game will not be registered.', { source: 'shortcuts', shortcut: action.shortcut })
      }
    }
    actions = actions.filter(action => !allShortcuts.has(action.shortcut))

    const duplicates = new Set<string>()
    for (const action of actions) {
      if (allShortcuts.has(action.shortcut)) {
        logger.error('It is not possible to use the same hotkey for multiple actions.', { source: 'shortcuts', shortcut: action.shortcut })
        duplicates.add(action.shortcut)
      } else {
        allShortcuts.add(action.shortcut)
      }
    }
    actions = actions.filter(action =>
      !duplicates.has(action.shortcut) ||
      action.action.type === 'toggle-overlay')
  }

  return actions
}

function registerGlobal () {
  const toRegister = shortcutsFromConfig()
  for (const entry of toRegister) {
    const isOk = globalShortcut.register(shortcutToElectron(entry.shortcut), () => {
      if (entry.keepModKeys) {
        const nonModKey = entry.shortcut.split(' + ').filter(key => !isModKey(key))[0]
        uIOhook.keyToggle(UiohookKey[nonModKey as UiohookKeyT], 'up')
      } else {
        entry.shortcut.split(' + ').reverse().forEach(key => { uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], 'up') })
      }

      if (entry.action.type === 'toggle-overlay') {
        toggleOverlayState()
      } else if (entry.action.type === 'paste-in-chat') {
        typeInChat(entry.action.text, entry.action.send)
      } else if (entry.action.type === 'trigger-event') {
        overlaySendEvent({ name: entry.action.eventName, payload: entry.action.payload } as ipc.IpcEvent)
      } else if (entry.action.type === 'stash-search') {
        stashSearch(entry.action.text)
      } else if (entry.action.type === 'copy-item') {
        const { action } = entry

        const pressPosition = screen.getCursorScreenPoint()

        pollClipboard()
          .then(clipboard => {
            if (action.eventName === 'price-check-quick' || action.eventName === 'price-check-locked') {
              showPriceCheck({ clipboard, pressPosition, eventName: action.eventName })
            } else {
              overlaySendEvent({
                name: action.eventName,
                payload: { clipboard, position: pressPosition }
              })
              if (action.focusOverlay) {
                assertOverlayActive()
              }
            }
          }).catch(() => {})

        if (!entry.keepModKeys) {
          pressKeysToCopyItemText()
        } else {
          pressKeysToCopyItemText(entry.shortcut.split(' + ').filter(key => isModKey(key)))
        }
      }
    })

    if (!isOk) {
      logger.error('Failed to register a shortcut. It is already registered by another application.', { source: 'shortcuts', shortcut: entry.shortcut })
    }

    if (entry.action.type === 'test-only') {
      globalShortcut.unregister(shortcutToElectron(entry.shortcut))
    }
  }

  logger.verbose('Registered Global', { source: 'shortcuts', total: toRegister.length })
}

function unregisterGlobal () {
  globalShortcut.unregisterAll()
  logger.verbose('Unregistered Global', { source: 'shortcuts' })
}

function pressKeysToCopyItemText (pressedModKeys: string[] = []) {
  let keys = mergeTwoHotkeys('Ctrl + C', gameConfig?.highlightKey || 'Alt').split(' + ')
  keys = keys.filter(key => key !== 'C' && !pressedModKeys.includes(key))

  for (const key of keys) {
    uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], 'down')
  }

  // finally press `C` to copy text
  uIOhook.keyTap(UiohookKey.C)

  keys.reverse()
  for (const key of keys) {
    uIOhook.keyToggle(UiohookKey[key as UiohookKeyT], 'up')
  }
}

export function setupShortcuts () {
  if (PoeWindow.isActive) {
    registerGlobal()
  }
  PoeWindow.on('active-change', (isActive) => {
    process.nextTick(() => {
      if (isActive === PoeWindow.isActive) {
        if (isActive) {
          registerGlobal()
        } else {
          unregisterGlobal()
        }
      }
    })
  })

  overlayOnEvent('OVERLAY->MAIN::stash-search', (_, { text }) => { stashSearch(text) })

  uIOhook.on('keydown', (e) => {
    const pressed = eventToString(e)
    logger.debug('Keydown', { source: 'shortcuts', keys: pressed })
  })

  uIOhook.on('keyup', (e) => {
    logger.debug('Keyup', { source: 'shortcuts', key: UiohookToName[e.keycode] || 'unknown' })
  })

  uIOhook.on('wheel', (e) => {
    if (!e.ctrlKey || !PoeWindow.bounds || !PoeWindow.isActive || !config.get('stashScroll')) return

    if (!isGameScrolling(e)) {
      if (e.rotation > 0) {
        uIOhook.keyTap(UiohookKey.ArrowRight)
      } else if (e.rotation < 0) {
        uIOhook.keyTap(UiohookKey.ArrowLeft)
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
  restoreClipboard((clipboard) => {
    assertPoEActive()
    clipboard.writeText(text)
    uIOhook.keyTap(UiohookKey.F, [UiohookKey.Ctrl])
    uIOhook.keyTap(UiohookKey.V, [UiohookKey.Ctrl])
    uIOhook.keyTap(UiohookKey.Enter)
  })
}

function eventToString (e: { keycode: number, ctrlKey: boolean, altKey: boolean, shiftKey: boolean }) {
  const { ctrlKey, shiftKey, altKey } = e

  let code = UiohookToName[e.keycode]
  if (!code) return 'unknown'

  if (code === 'Shift' || code === 'Alt' || code === 'Ctrl') return code

  if (ctrlKey && shiftKey && altKey) code = `Ctrl + Shift + Alt + ${code}`
  else if (shiftKey && altKey) code = `Shift + Alt + ${code}`
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
