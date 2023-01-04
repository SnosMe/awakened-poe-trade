import { uIOhook, UiohookKey as Key } from 'uiohook-napi'
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

export function typeInChat (text: string, send: boolean, clipboard: HostClipboard) {
  clipboard.restoreShortly((clipboard) => {
    if (text.startsWith(PLACEHOLDER_LAST)) {
      text = text.slice(`${PLACEHOLDER_LAST} `.length)
      clipboard.writeText(text)
      uIOhook.keyTap(Key.Enter, [Key.Meta])
    } else if (text.endsWith(PLACEHOLDER_LAST)) {
      text = text.slice(0, -PLACEHOLDER_LAST.length)
      clipboard.writeText(text)
      uIOhook.keyTap(Key.Enter, [Key.Meta])
      uIOhook.keyTap(Key.Home)
      uIOhook.keyTap(Key.Delete)
    } else {
      clipboard.writeText(text)
      uIOhook.keyTap(Key.Enter)
      if (!AUTO_CLEAR.includes(text[0])) {
        uIOhook.keyTap(Key.A, [Key.Meta])
      }
    }

    uIOhook.keyTap(Key.V, [Key.Meta])

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
    uIOhook.keyTap(Key.F, [Key.Meta])
    uIOhook.keyTap(Key.V, [Key.Meta])
    uIOhook.keyTap(Key.Enter)
  })
}
