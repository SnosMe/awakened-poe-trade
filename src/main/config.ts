import Store from 'electron-store'
import { ipcMain } from 'electron'
import { Config, defaultConfig } from '@/ipc/types'
import { GET_CONFIG, PUSH_CONFIG, CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { overlayWindow } from './overlay-window'

export function setupConfigEvents () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = config.store
  })
  ipcMain.on(CLOSE_SETTINGS_WINDOW, (e, cfg) => {
    if (cfg != null) {
      batchUpdateConfig(cfg)
    }
  })
}

export const config = new Store<Config>({
  name: 'config',
  cwd: 'apt-data',
  defaults: defaultConfig
})

export function batchUpdateConfig (upd: Config) {
  // for (const key in upd) {
  //   config.set(key as keyof Config, upd[key as keyof Config])
  // }
  config.store = upd
  overlayWindow!.webContents.send(PUSH_CONFIG, upd)
}
