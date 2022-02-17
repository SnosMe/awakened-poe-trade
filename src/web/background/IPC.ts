import type { Renderer } from 'electron'
import type { IpcEvent, IpcEventPayload, IpcGetConfig, IpcImportFile } from '@/ipc/ipc-event'
import { Config, defaultConfig } from '@/ipc/types'

let electron: typeof Renderer | undefined
try {
  electron = require('electron')
} catch {}

class MainProcessBinding {
  private evBus = new EventTarget()

  constructor () {
    if (electron) {
      electron.ipcRenderer.on('named-event', (_e, data: IpcEvent) => {
        this.selfDispatch(data)
      })
    }
  }

  selfDispatch (event: IpcEvent) {
    this.evBus.dispatchEvent(new CustomEvent(event.name, {
      detail: event.payload
    }))
  }

  sendEvent (event: IpcEvent) {
    if (electron) {
      electron.ipcRenderer.send(event.name, event.payload)
    }
  }

  onEvent<Name extends IpcEvent['name']> (
    name: Name,
    cb: (payload: IpcEventPayload<Name>) => void
  ) {
    this.evBus.addEventListener(name, (e) => {
      cb((e as CustomEvent<IpcEventPayload<Name>>).detail)
    })
  }

  closeOverlay () {
    this.sendEvent({ name: 'OVERLAY->MAIN::close-overlay', payload: undefined })
  }

  getConfig (): Config {
    if (electron) {
      const name: IpcGetConfig['name'] = 'OVERLAY->MAIN::get-config'
      return electron.ipcRenderer.sendSync(name) as IpcGetConfig['payload']
    } else {
      return defaultConfig()
    }
  }

  openSystemBrowser (url: string) {
    if (electron) {
      this.sendEvent({ name: 'OVERLAY->MAIN::system-browser', payload: url })
    } else {
      window.open(url)
    }
  }

  saveConfig (config: Config) {
    this.sendEvent({ name: 'OVERLAY->MAIN::save-config', payload: config })
  }

  importFile (filePath: string) {
    if (electron) {
      const name: IpcImportFile['name'] = 'OVERLAY->MAIN::import-file'
      return electron.ipcRenderer.sendSync(name, filePath) as IpcImportFile['payload']
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
