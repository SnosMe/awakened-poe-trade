import Store from 'electron-store'
import { ipcMain } from 'electron'
import { Config, defaultConfig } from '@/ipc/types'
import { GET_CONFIG, PUSH_CONFIG, CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { overlayWindow } from './overlay-window'
import { logger } from './logger'

export function setupConfigEvents () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = config.store
  })
  ipcMain.on(PUSH_CONFIG, (e, cfg) => {
    batchUpdateConfig(cfg, false)
  })
  ipcMain.on(CLOSE_SETTINGS_WINDOW, (e, cfg) => {
    if (cfg != null) {
      batchUpdateConfig(cfg, true)
    }
  })
}

export const config = (() => {
  const config = new Store<Config>({
    name: 'config',
    cwd: 'apt-data',
    defaults: defaultConfig
  })

  const forbidden = ['Ctrl + C', 'Ctrl + V', 'Ctrl + A', 'Ctrl + F']
  if (forbidden.includes(config.get('priceCheckLocked') as string)) { config.set('priceCheckLocked', null) }
  if (forbidden.includes(config.get('wikiKey') as string)) { config.set('wikiKey', null) }
  if (forbidden.includes(config.get('mapCheckKey') as string)) { config.set('mapCheckKey', null) }
  const comands = config.get('commands')
  for (const c of comands) {
    if (forbidden.includes(c.hotkey as string)) { c.hotkey = null }
  }
  config.set('commands', comands)

  if (config.get('priceCheckKeyHold') === 'Ctrl') {
    if (['C', 'V', 'A', 'F'].includes(config.get('priceCheckKey') as string)) {
      config.set('priceCheckKey', null)
    }
  }

  return config
})()

export function batchUpdateConfig (upd: Config, push = true) {
  // for (const key in upd) {
  //   config.set(key as keyof Config, upd[key as keyof Config])
  // }
  config.store = upd
  logger.verbose('Saved', { source: 'config', push })
  if (push) {
    overlayWindow!.webContents.send(PUSH_CONFIG, upd)
  }
}
