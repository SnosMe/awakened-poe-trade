import { clipboard, Clipboard } from 'electron'
import { config } from './config'

// PoE must read clipboard within this timeframe,
// after that we restore clipboard.
// If game lagged for some reason, it will read
// wrong content (= restored clipboard).
const THROTTLE = 120

let isRestored = true

export function restoreClipboard (cb: (clipboard: Clipboard) => void) {
  // Not only do we not overwrite the clipboard,
  // but we don't exec callback.
  // This throttling helps against disconnects
  // from "Too many actions".
  if (!isRestored) {
    return
  }

  isRestored = false
  const saved = clipboard.readText()
  cb(clipboard)
  setTimeout(() => {
    if (config.get('restoreClipboard')) {
      clipboard.writeText(saved)
    }
    isRestored = true
  }, THROTTLE)
}
