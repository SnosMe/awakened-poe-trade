import Store from 'electron-store'
import { ipcMain } from 'electron'
import { Config, defaultConfig } from '@/ipc/types'
import { GET_CONFIG, PUSH_CONFIG } from '@/ipc/ipc-event'
import { win } from './window'

export function setupConfig () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = { ...config.store, subdomain: 'us' }
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
  win.webContents.send(PUSH_CONFIG, upd)
}
