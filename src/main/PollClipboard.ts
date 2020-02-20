import { clipboard } from 'electron'
import { TAG_RARITY } from '../components/parser/constants'

export async function pollClipboard (delay: number, limit: number): Promise<string> {
  let textBefore = clipboard.readText()
  let elapsed = 0

  if (textBefore.startsWith(TAG_RARITY)) {
    textBefore = ''
    clipboard.writeText('')
  }

  return new Promise((resolve, reject) => {
    function poll () {
      const textAfter = clipboard.readText()

      if (textBefore !== textAfter) {
        clipboard.writeText(textBefore)
        resolve(textAfter)
      } else {
        elapsed += delay
        if (elapsed < limit) {
          setTimeout(poll, delay)
        } else {
          reject(new Error('Clipboard was not changed'))
        }
      }
    }

    poll()
  })
}
