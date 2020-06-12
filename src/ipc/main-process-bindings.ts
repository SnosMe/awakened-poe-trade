import { RendererInterface } from 'electron'
import * as ipcEvent from '@/ipc/ipc-event'
import { Config, League, defaultConfig } from '@/ipc/types'

let electron: RendererInterface | undefined
try {
  electron = require('electron')
} catch {}

class MainProcessBinding extends EventTarget {
  constructor () {
    super()

    if (electron) {
      electron.ipcRenderer.on(ipcEvent.PRICE_CHECK, (e, data) => {
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

      electron.ipcRenderer.on(ipcEvent.FOCUS_CHANGE, (e, data) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.FOCUS_CHANGE, { detail: data }))
      })

      electron.ipcRenderer.on(ipcEvent.PRICE_CHECK_CANCELED, () => {
        this.dispatchEvent(new CustomEvent(ipcEvent.PRICE_CHECK_CANCELED))
      })

      electron.ipcRenderer.on(ipcEvent.UPDATE_AVAILABLE, (e, updateInfo) => {
        this.dispatchEvent(new CustomEvent(ipcEvent.UPDATE_AVAILABLE, {
          detail: updateInfo
        }))
      })
    }
  }

  selfEmitPriceCheck (data: { clipboard: string, position: string }) {
    this.dispatchEvent(new CustomEvent('price-check', {
      detail: data
    }))
  }

  readyReceiveEvents () {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.OVERLAY_READY)
    }
  }

  dprChanged (dpr: number) {
    if (electron) {
      electron.ipcRenderer.send(ipcEvent.DPR_CHANGE, dpr)
    }
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
