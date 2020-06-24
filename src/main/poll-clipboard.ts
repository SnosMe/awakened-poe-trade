import { clipboard } from 'electron'
import { TAG_RARITY } from '@/parser/constants'
import { logger } from './logger'

const DELAY = 48
const LIMIT = 500

export let isPollingClipboard = false
let clipboardPromise: Promise<string> | undefined
let elapsed: number

export async function pollClipboard (): Promise<string> {
  isPollingClipboard = true
  elapsed = 0
  if (clipboardPromise) {
    return clipboardPromise
  }

  let textBefore = clipboard.readText()
  if (textBefore.startsWith(TAG_RARITY)) {
    textBefore = ''
    clipboard.writeText('')
  }

  clipboardPromise = new Promise((resolve, reject) => {
    function poll () {
      const textAfter = clipboard.readText()

      if (textAfter.startsWith(TAG_RARITY)) {
        clipboard.writeText(textBefore)
        isPollingClipboard = false
        clipboardPromise = undefined
        resolve(textAfter)
      } else {
        elapsed += DELAY
        if (elapsed < LIMIT) {
          setTimeout(poll, DELAY)
        } else {
          logger.warn('No changes found', { source: 'clipboard', timeout: LIMIT })
          isPollingClipboard = false
          clipboardPromise = undefined
          reject(new Error('Clipboard was not changed'))
        }
      }
    }

    poll()
  })

  return clipboardPromise
}
