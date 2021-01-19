import { clipboard } from 'electron'
import robotjs from 'robotjs'
import { config } from './config'

const PLACEHOLDER_LAST = '@last'
const AUTO_CLEAR = [
  '#', // Global
  '%', // Party
  '@', // Whisper
  '$', // Trade
  '&', // Guild
  '/' // Command
]

export function typeInChat (text: string, send: boolean) {
  const saved = clipboard.readText()

  if (text.startsWith(PLACEHOLDER_LAST)) {
    text = text.substr(`${PLACEHOLDER_LAST} `.length)
    clipboard.writeText(text)
    robotjs.keyTap('Enter', ['Ctrl'])
  } else if (text.endsWith(PLACEHOLDER_LAST)) {
    text = text.slice(0, -PLACEHOLDER_LAST.length)
    clipboard.writeText(text)
    robotjs.keyTap('Enter', ['Ctrl'])
    robotjs.keyTap('Home')
    robotjs.keyTap('Delete')
  } else {
    clipboard.writeText(text)
    robotjs.keyTap('Enter')
    if (!AUTO_CLEAR.includes(text[0])) {
      robotjs.keyTap('A', ['Ctrl'])
    }
  }

  robotjs.keyTap('V', ['Ctrl'])

  if (send) {
    robotjs.keyTap('Enter')
    // restore the last chat
    robotjs.keyTap('Enter')
    robotjs.keyTap('ArrowUp')
    robotjs.keyTap('ArrowUp')
    robotjs.keyTap('Escape')
  }

  if (config.get('restoreClipboard')) {
    setTimeout(() => {
      clipboard.writeText(saved)
    }, 120)
  }
}
