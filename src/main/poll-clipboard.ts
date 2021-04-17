import { clipboard } from 'electron'
import { logger } from './logger'
import { config } from './config'

const DELAY = 48
const LIMIT = 500

export let isPollingClipboard = false
let clipboardPromise: Promise<string> | undefined
let elapsed: number

export async function pollClipboard (): Promise<string> {
  isPollingClipboard = true
  elapsed = 0
  if (clipboardPromise) {
    return await clipboardPromise
  }

  let textBefore = clipboard.readText()
  if (textBefore.startsWith(getTranslatedFirstLine())) {
    textBefore = ''
    clipboard.writeText('')
  }

  clipboardPromise = new Promise((resolve, reject) => {
    function poll () {
      const textAfter = clipboard.readText()

      if (textAfter.startsWith(getTranslatedFirstLine())) {
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

function getTranslatedFirstLine () {
  return TAG_ITEM_CLASS[config.get('language')]
}

const TAG_ITEM_CLASS = {
  en: 'Item Class: ',
  ru: 'Класс предмета: '
}
