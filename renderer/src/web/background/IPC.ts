import type { IpcEvent, IpcEventPayload } from '@ipc/ipc-event'
import { Config, defaultConfig, PreloadExposed } from '@ipc/types'

declare global {
  interface Window {
    electronAPI?: PreloadExposed
  }
}

class MainProcessBinding {
  private evBus = new EventTarget()

  constructor () {
    if (window.electronAPI) {
      window.electronAPI.onEvent(data => {
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
    if (window.electronAPI) {
      window.electronAPI.sendEvent(event)
    }
  }

  onEvent<Name extends IpcEvent['name']> (
    name: Name,
    cb: (payload: IpcEventPayload<Name>) => void
  ): AbortController {
    const controller = new AbortController()
    this.evBus.addEventListener(name, (e) => {
      cb((e as CustomEvent<IpcEventPayload<Name>>).detail)
    }, { signal: controller.signal })
    return controller
  }

  closeOverlay () {
    this.sendEvent({ name: 'OVERLAY->MAIN::close-overlay', payload: undefined })
  }

  getConfig (): Config {
    if (window.electronAPI) {
      return window.electronAPI.getConfig()
    } else {
      return defaultConfig()
    }
  }

  saveConfig (config: Config) {
    this.sendEvent({ name: 'OVERLAY->MAIN::save-config', payload: config })
  }

  importFile (filePath: string) {
    if (window.electronAPI) {
      return window.electronAPI.importFile(filePath)
    }
  }

  get CORS () {
    return (!window.electronAPI)
      ? 'https://apt-cors.snos.workers.dev/?'
      : ''
  }

  get isElectron () {
    return (window.electronAPI != null)
  }
}

export const MainProcess = new MainProcessBinding()
