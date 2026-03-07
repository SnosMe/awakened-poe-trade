import { uIOhook, UiohookKey as Key } from 'uiohook-napi'
import { execSync } from 'child_process'
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

// On Linux/X11, uiohook's keyTap with modifiers doesn't reliably deliver
// Ctrl+V to the game — the modifier gets lost and bare 'v' is typed.
// xdotool handles X11 input simulation correctly.
function xdotoolKey (keys: string) {
  execSync(`xdotool key --delay 20 ${keys}`, { timeout: 2000 })
}

export function typeInChat (text: string, send: boolean, clipboard: HostClipboard) {
  clipboard.restoreShortly((clipboard) => {
    const modifiers = process.platform === 'darwin' ? [Key.Meta] : [Key.Ctrl]

    if (text.startsWith(PLACEHOLDER_LAST)) {
      text = text.slice(`${PLACEHOLDER_LAST} `.length)
      clipboard.writeText(text)
      if (IS_LINUX) {
        xdotoolKey('ctrl+Return')
        setTimeout(() => {
          xdotoolKey('ctrl+v')
          if (send) linuxSend()
        }, 50)
      } else {
        uIOhook.keyTap(Key.Enter, modifiers)
        uIOhook.keyTap(Key.V, modifiers)
        if (send) _send()
      }
    } else if (text.endsWith(PLACEHOLDER_LAST)) {
      text = text.slice(0, -PLACEHOLDER_LAST.length)
      clipboard.writeText(text)
      if (IS_LINUX) {
        xdotoolKey('ctrl+Return')
        xdotoolKey('Home Home Delete')
        setTimeout(() => {
          xdotoolKey('ctrl+v')
          if (send) linuxSend()
        }, 50)
      } else {
        uIOhook.keyTap(Key.Enter, modifiers)
        uIOhook.keyTap(Key.Home)
        uIOhook.keyTap(Key.Home)
        uIOhook.keyTap(Key.Delete)
        uIOhook.keyTap(Key.V, modifiers)
        if (send) _send()
      }
    } else {
      clipboard.writeText(text)
      if (IS_LINUX) {
        xdotoolKey('Return')
        setTimeout(() => {
          if (!AUTO_CLEAR.includes(text[0])) {
            xdotoolKey('ctrl+a')
          }
          xdotoolKey('ctrl+v')
          if (send) linuxSend()
        }, 50)
      } else {
        uIOhook.keyTap(Key.Enter)
        if (!AUTO_CLEAR.includes(text[0])) {
          uIOhook.keyTap(Key.A, modifiers)
        }
        uIOhook.keyTap(Key.V, modifiers)
        if (send) _send()
      }
    }
  })
}

function _send () {
  uIOhook.keyTap(Key.Enter)
  uIOhook.keyTap(Key.Enter)
  uIOhook.keyTap(Key.ArrowUp)
  uIOhook.keyTap(Key.ArrowUp)
  uIOhook.keyTap(Key.Escape)
}

function linuxSend () {
  xdotoolKey('Return Return Up Up Escape')
}

export function stashSearch (
  text: string,
  clipboard: HostClipboard,
  overlay: OverlayWindow
) {
  clipboard.restoreShortly((clipboard) => {
    overlay.assertGameActive()
    clipboard.writeText(text)
    if (IS_LINUX) {
      xdotoolKey('ctrl+f')
      xdotoolKey('ctrl+v')
      xdotoolKey('Return')
    } else {
      uIOhook.keyTap(Key.F, [Key.Ctrl])
      uIOhook.keyTap(Key.V, [process.platform === 'darwin' ? Key.Meta : Key.Ctrl])
      uIOhook.keyTap(Key.Enter)
    }
  })
}
