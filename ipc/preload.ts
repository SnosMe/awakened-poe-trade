import { contextBridge, ipcRenderer } from 'electron'
import type { IpcGetConfig, IpcImportFile } from './ipc-event'
import type { PreloadExposed } from './types'

const api: PreloadExposed = {
  sendEvent (event) {
    ipcRenderer.send(event.name, event.payload)
  },
  onEvent (cb) {
    ipcRenderer.on('named-event', (_e, data) => {
      cb(data)
    })
  },
  getConfig () {
    const name: IpcGetConfig['name'] = 'OVERLAY->MAIN::get-config'
    return ipcRenderer.sendSync(name) as IpcGetConfig['payload']
  },
  importFile (filePath: string) {
    const name: IpcImportFile['name'] = 'OVERLAY->MAIN::import-file'
    return ipcRenderer.sendSync(name, filePath) as IpcImportFile['payload']
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
