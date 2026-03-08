import { uIOhook, UiohookKey as Key } from 'uiohook-napi'
import { execFileSync } from 'child_process'
import process from 'process';
import type { HostClipboard } from './HostClipboard'
import type { OverlayWindow } from '../windowing/OverlayWindow'

const PLACEHOLDER_LAST = '@last'
const AUTO_CLEAR = [
  '#', // Global
  '%', // Party
  '@', // Whisper
  '$', // Trade
  '&', // Guild
  '/' // Command
]

const IS_LINUX = process.platform === 'linux'
const XDOTOOL_DELAY_MS = '20'
let hasXdotool: boolean | undefined

function canUseXdotool () {
  if (!IS_LINUX) return false
  if (hasXdotool != null) return hasXdotool

  try {
    execFileSync('xdotool', ['--version'], { stdio: 'ignore', timeout: 2000 })
    hasXdotool = true
  } catch {
    hasXdotool = false
  }

  return hasXdotool
}

function xdotool (...args: string[]) {
  execFileSync('xdotool', args, { stdio: 'ignore', timeout: 2000 })
}

function xdotoolChatPaste (text: string, send: boolean) {
  if (text.startsWith(PLACEHOLDER_LAST)) {
    xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'ctrl+Return', 'sleep', '0.05', 'key', 'ctrl+v')
  } else if (text.endsWith(PLACEHOLDER_LAST)) {
    xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'ctrl+Return', 'sleep', '0.05', 'key', 'Home', 'Home', 'Delete', 'key', 'ctrl+v')
  } else {
    xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'Return')
    if (!AUTO_CLEAR.includes(text[0])) {
      xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'ctrl+a')
    }
    xdotool('sleep', '0.05', 'key', '--delay', XDOTOOL_DELAY_MS, 'ctrl+v')
  }

  if (send) {
    xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'Return', 'Return', 'Up', 'Up', 'Escape')
  }
}

export function typeInChat (text: string, send: boolean, clipboard: HostClipboard) {
  clipboard.restoreShortly((clipboard) => {
    const modifiers = process.platform === 'darwin' ? [Key.Meta] : [Key.Ctrl]
    clipboard.writeText(text.startsWith(PLACEHOLDER_LAST)
      ? text.slice(`${PLACEHOLDER_LAST} `.length)
      : (text.endsWith(PLACEHOLDER_LAST) ? text.slice(0, -PLACEHOLDER_LAST.length) : text))

    if (canUseXdotool()) {
      xdotoolChatPaste(text, send)
      return
    }

    if (text.startsWith(PLACEHOLDER_LAST)) {
      text = text.slice(`${PLACEHOLDER_LAST} `.length)
      uIOhook.keyTap(Key.Enter, modifiers)
    } else if (text.endsWith(PLACEHOLDER_LAST)) {
      text = text.slice(0, -PLACEHOLDER_LAST.length)
      uIOhook.keyTap(Key.Enter, modifiers)
      uIOhook.keyTap(Key.Home)
      // press twice to focus input when using controller
      uIOhook.keyTap(Key.Home)
      uIOhook.keyTap(Key.Delete)
    } else {
      uIOhook.keyTap(Key.Enter)
      if (!AUTO_CLEAR.includes(text[0])) {
        uIOhook.keyTap(Key.A, modifiers)
      }
    }

    uIOhook.keyTap(Key.V, modifiers)

    if (send) {
      uIOhook.keyTap(Key.Enter)
      // restore the last chat
      uIOhook.keyTap(Key.Enter)
      uIOhook.keyTap(Key.ArrowUp)
      uIOhook.keyTap(Key.ArrowUp)
      uIOhook.keyTap(Key.Escape)
    }
  })
}

export function stashSearch (
  text: string,
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  clipboard.restoreShortly((clipboard) => {
    overlay.assertGameActive()
    clipboard.writeText(text)

    if (canUseXdotool()) {
      xdotool('key', '--delay', XDOTOOL_DELAY_MS, 'ctrl+f', 'sleep', '0.05', 'key', 'ctrl+v', 'key', 'Return')
      return
    }

    uIOhook.keyTap(Key.F, [Key.Ctrl])
    uIOhook.keyTap(Key.V, [process.platform === 'darwin' ? Key.Meta : Key.Ctrl])
    uIOhook.keyTap(Key.Enter)
  })
}
