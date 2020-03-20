import { RendererInterface } from 'electron'
import * as ipcEvent from '@/shared/ipc-event'
import { Config, League, defaultConfig } from '@/shared/types'

let electron: RendererInterface | undefined
try {
  electron = require('electron')
} catch {}

class MainProcessBinding extends EventTarget {
  constructor () {
    super()

    if (electron) {
      electron.ipcRenderer.on('price-check', (e, data) => {
        this.selfEmitPriceCheck(data)
      })

      electron.ipcRenderer.on(ipcEvent.LEAGUE_SELECTED, (e, leagueId) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.LEAGUE_SELECTED, {
          detail: leagueId
        }))
      })

      electron.ipcRenderer.on(ipcEvent.PUSH_CONFIG, (e, cfg) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.PUSH_CONFIG, {
          detail: cfg
        }))
      })
    }
  }

  selfEmitPriceCheck (data: { clipboard: string, position: string }) {
    this.dispatchEvent(new CustomEvent('price-check', {
      detail: data
    }))
  }

  priceCheckHide () {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.PRICE_CHECK_HIDE)
    }
  }

  getConfig (): Config {
    if (electron) {
      return electron.ipcRenderer.sendSync(ipcEvent.GET_CONFIG)
    } else {
      return defaultConfig
    }
  }

  priceCheckMouse (string: string, modifier?: string) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.PRICE_CHECK_MOUSE, string, modifier)
    }
  }

  sendLeaguesReady (leagues: League[]) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.LEAGUES_READY, leagues)
    }
  }

  openUserBrowser (url: string) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.OPEN_LINK_EXTERNAL, url)
    }
  }

  openAppBrowser (url: string) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.OPEN_LINK, url)
      this.dispatchEvent(new Event(ipcEvent.OPEN_LINK))
    } else {
      window.open(url)
    }
  }

  closeSettingsWindow (config?: Config) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.CLOSE_SETTINGS_WINDOW, config)
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
