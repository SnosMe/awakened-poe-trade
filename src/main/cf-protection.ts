import { overlayWindow } from './overlay-window'

export function setupCfProtection () {
  overlayWindow!.webContents.session.webRequest.onHeadersReceived({
    urls: ['https://*.pathofexile.com/*']
  }, (details, next) => {
    if (details.responseHeaders?.['set-cookie']) {
      const cookies = details.responseHeaders['set-cookie']
      const cfduid = cookies.find(c => c.startsWith('__cfduid'))

      if (cfduid) {
        // console.log(cfduid)
        // @TODO will break with next Chromium update?
        details.responseHeaders['set-cookie'] = [
          ...cookies.filter(c => !c.startsWith('__cfduid')),
          cfduid.split(';').filter(_ => _.trim() !== 'SameSite=Lax').join(';')
        ]
      }
    }

    next({ responseHeaders: details.responseHeaders })
  })
}
