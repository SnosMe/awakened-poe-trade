import { RendererInterface } from 'electron'
import { PRICE_CHECK_VISIBLE, LOCK_WINDOW, GET_CONFIG, LEAGUES_READY, LEAGUE_SELECTED, OPEN_LINK } from '@/shared/ipc-event'
import { Config, League } from '@/shared/types'

let electron: RendererInterface | undefined
try {
  electron = require('electron')
} catch {}

class MainProcessBinding extends EventTarget {
  constructor () {
    super()

    if (electron) {
      electron.ipcRenderer.on('price-check', (e, clipboard) => {
        this.selfEmitPriceCheck(clipboard)
      })

      electron.ipcRenderer.on(LEAGUE_SELECTED, (e, leagueId) => {
        this.dispatchEvent(new CustomEvent('league-selected', {
          detail: leagueId
        }))
      })
    }
  }

  selfEmitPriceCheck (text: string) {
    this.dispatchEvent(new CustomEvent('price-check', {
      detail: text
    }))
  }

  priceCheckVisible (isVisible: boolean) {
    if (electron) {
      electron.ipcRenderer.send(PRICE_CHECK_VISIBLE, isVisible)
    }
  }

  getConfig (): Config {
    if (electron) {
      return electron.ipcRenderer.sendSync(GET_CONFIG)
    } else {
      return {}
    }
  }

  lockWindow () {
    if (electron) {
      electron.ipcRenderer.send(LOCK_WINDOW)
    }
  }

  sendLeaguesReady (leagues: League[]) {
    if (electron) {
      electron.ipcRenderer.send(LEAGUES_READY, leagues)
    }
  }

  openUserBrowser (url: string) {
    if (electron) {
      electron.shell.openExternal(url)
    }
  }

  openAppBrowser (url: string) {
    if (electron) {
      electron.ipcRenderer.send(OPEN_LINK, url)
    } else {
      window.open(url)
    }
  }

  get CORS () {
    return (!electron)
      ? 'https://apt-cors.snos.workers.dev/?'
      : ''
  }

  get isElectron () {
    return (electron != null)
  }
}

export const MainProcess = new MainProcessBinding()
