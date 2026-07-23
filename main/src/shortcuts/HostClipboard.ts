import { clipboard } from 'electron'
import type { Logger } from '../RemoteLogger'
import { isPlasmaWayland, readWaylandClipboard, writeWaylandClipboard } from '../wayland'

const POLL_DELAY = 48
const POLL_LIMIT = 500

// PoE must read clipboard within this timeframe,
// after that we restore clipboard.
// If game lagged for some reason, it will read
// wrong content (= restored clipboard, potentially containing password).
const RESTORE_AFTER = 120

export class HostClipboard {
  private pollPromise?: Promise<string>
  private elapsed = 0
  private shouldRestore = false

  private isRestored = true

  get isPolling () { return this.pollPromise != null }

  constructor (
    private logger: Logger
  ) {}

  updateOptions (restoreClipboard: boolean) {
    this.shouldRestore = restoreClipboard
  }

  async readItemText (copy: () => void): Promise<string> {
    this.elapsed = 0
    if (this.pollPromise) {
      copy()
      return await this.pollPromise
    }

    let textBefore = await this.readText()
    if (isPoeItem(textBefore)) {
      textBefore = ''
      if (process.platform !== 'linux') {
        await this.writeText('')
      } else {
        // workaround KDE's "Prevent empty clipboard" feature
        // see https://github.com/SnosMe/awakened-poe-trade/issues/1790#issuecomment-4062830614
        await this.writeText(`__APT_FORCE_EMPTY_${Date.now()}`)
      }
    } else if (process.platform === 'linux') {
      // workaround bug in Proton 10+ https://github.com/SnosMe/awakened-poe-trade/issues/1846
      await this.writeText(`__APT_FORCE_EMPTY_${Date.now()}`)
    }

    this.pollPromise = new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const textAfter = await this.readText()

          if (isPoeItem(textAfter)) {
            if (this.shouldRestore) {
              await this.writeText(textBefore)
            }
            this.pollPromise = undefined
            resolve(textAfter)
          } else {
            this.elapsed += POLL_DELAY
            if (this.elapsed < POLL_LIMIT) {
              setTimeout(() => { void poll() }, POLL_DELAY)
            } else {
              if (this.shouldRestore) {
                await this.writeText(textBefore)
              }
              this.pollPromise = undefined

              this.logger.write('warn [ClipboardPoller] No item text found.')
              reject(new Error('Reading clipboard timed out'))
            }
          }
        } catch (error) {
          this.pollPromise = undefined
          reject(error)
        }
      }
      setTimeout(() => { void poll() }, POLL_DELAY)
    })

    copy()
    return this.pollPromise
  }

  // when `shouldRestore` is false, this function continues
  // to work as a throttler for callback
  async restoreShortly (text: string, cb: () => void) {
    // Not only do we not overwrite the clipboard, but we don't exec callback.
    // This throttling helps against disconnects from "Too many actions".
    if (!this.isRestored) {
      return
    }

    this.isRestored = false
    let saved: string
    try {
      saved = await this.readText()
      await this.writeText(text)
      cb()
    } catch (error) {
      this.isRestored = true
      this.logger.write(`warn [Clipboard] ${String(error)}`)
      return
    }
    setTimeout(() => {
      void (async () => {
        try {
          if (this.shouldRestore) await this.writeText(saved)
        } catch (error) {
          this.logger.write(`warn [Clipboard] ${String(error)}`)
        } finally {
          this.isRestored = true
        }
      })()
    }, RESTORE_AFTER)
  }

  private async readText () {
    return isPlasmaWayland ? await readWaylandClipboard() : clipboard.readText()
  }

  private async writeText (text: string) {
    if (isPlasmaWayland) await writeWaylandClipboard(text)
    else clipboard.writeText(text)
  }
}

function isPoeItem (text: string) {
  return LANGUAGE_DETECTOR.find(({ firstLine }) => text.startsWith(firstLine))
}

const LANGUAGE_DETECTOR = [{
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
  lang: 'cmn-Hans',
  firstLine: '物品类别: '
}]
