import { clipboard } from 'electron'

export async function pollClipboard (delay: number, limit: number): Promise<string> {
  const textBefore = clipboard.readText()
  let elapsed = 0

  return new Promise((resolve, reject) => {
    function poll () {
      const textAfter = clipboard.readText()

      if (textBefore !== textAfter) {
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
