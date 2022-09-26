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
  if (isActiveLangItem(textBefore)) {
    textBefore = ''
    clipboard.writeText('')
  }

  clipboardPromise = new Promise((resolve, reject) => {
    function poll () {
      const textAfter = clipboard.readText()

      if (isActiveLangItem(textAfter)) {
        if (config.get('restoreClipboard')) {
          clipboard.writeText(textBefore)
        }
        isPollingClipboard = false
        clipboardPromise = undefined
        resolve(textAfter)
      } else {
        elapsed += DELAY
        if (elapsed < LIMIT) {
          setTimeout(poll, DELAY)
        } else {
          if (config.get('restoreClipboard')) {
            clipboard.writeText(textBefore)
          }
          isPollingClipboard = false
          clipboardPromise = undefined

          const otherLang = isInactiveLangItem(textAfter)
          if (otherLang) {
            logger.warn('Detected item in inactive or unsupported language.', { source: 'clipboard', language: otherLang.lang })
          } else {
            logger.warn('No item text found.', { source: 'clipboard', text: textAfter.slice(0, 40) })
          }
          reject(new Error('Reading clipboard timed out'))
        }
      }
    }

    poll()
  })

  return clipboardPromise
}

function isActiveLangItem (text: string) {
  const line = LANGUAGE_DETECTOR.find(({ lang }) => lang === config.get('language'))!.firstLine
  return text.startsWith(line)
}

function isInactiveLangItem (text: string) {
  return LANGUAGE_DETECTOR.find(({ firstLine }) => text.startsWith(firstLine))
}

export const LANGUAGE_DETECTOR = [{
  lang: 'en',
  firstLine: 'Item Class: '
}, {
  lang: 'ru',
  firstLine: 'Класс предмета: '
}, {
  lang: 'fr',
  firstLine: 'Classe d\'objet: '
}, {
  lang: 'de',
  firstLine: 'Gegenstandsklasse: '
}, {
  lang: 'pt',
  firstLine: 'Classe do Item: '
}, {
  lang: 'es',
  firstLine: 'Clase de objeto: '
}, {
  lang: 'th',
  firstLine: 'ชนิดไอเทม: '
}, {
  lang: 'ko',
  firstLine: '아이템 종류: '
}, {
  lang: 'cmn-Hant',
  firstLine: '物品種類: '
}, {
  lang: 'zh_CN',
  firstLine: '物品类别: '
}]
