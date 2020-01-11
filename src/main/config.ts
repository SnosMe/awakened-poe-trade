import Store from 'electron-store'
import { ipcMain } from 'electron'
import { Config } from '@/shared/types'
import { GET_CONFIG } from '@/shared/ipc-event'

export function setupConfig () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = config.store
  })
}

export const config = new Store<Config>({
  name: 'config',
  defaults: {}
})
