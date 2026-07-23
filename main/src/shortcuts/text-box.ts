import { UiohookKey as Key } from 'uiohook-napi'
import process from 'process';
import type { HostClipboard } from './HostClipboard'
import type { OverlayWindow } from '../windowing/OverlayWindow'
import type { Keyboard } from '../wayland'

const PLACEHOLDER_LAST = '@last'
const AUTO_CLEAR = [
  '#', // Global
  '%', // Party
  '@', // Whisper
  '$', // Trade
  '&', // Guild
  '/' // Command
]

export function typeInChat (text: string, send: boolean, clipboard: HostClipboard, uIOhook: Keyboard) {
  const modifiers = process.platform === 'darwin' ? [Key.Meta] : [Key.Ctrl]
  const startsWithLast = text.startsWith(PLACEHOLDER_LAST)
  const endsWithLast = text.endsWith(PLACEHOLDER_LAST)

  if (startsWithLast) {
    text = text.slice(`${PLACEHOLDER_LAST} `.length)
  } else if (endsWithLast) {
    text = text.slice(0, -PLACEHOLDER_LAST.length)
  }

  void clipboard.restoreShortly(text, () => {
    if (startsWithLast) {
      uIOhook.keyTap(Key.Enter, modifiers)
    } else if (endsWithLast) {
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
  overlay: OverlayWindow,
  uIOhook: Keyboard
) {
  void clipboard.restoreShortly(text, () => {
    overlay.assertGameActive()
    uIOhook.keyTap(Key.F, [Key.Ctrl])
    uIOhook.keyTap(Key.V, [process.platform === 'darwin' ? Key.Meta : Key.Ctrl])
    uIOhook.keyTap(Key.Enter)
  })
}
