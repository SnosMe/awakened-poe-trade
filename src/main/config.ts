import Store from 'electron-store'
import { ipcMain } from 'electron'
import isDeepEq from 'fast-deep-equal'
import { Config, defaultConfig } from '@/ipc/types'
import { forbidden, forbiddenCtrl } from '@/ipc/KeyToCode'
import { GET_CONFIG, PUSH_CONFIG, CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { overlayWindow } from './overlay-window'
import { logger } from './logger'
import { LogWatcher } from './LogWatcher'

export function setupConfigEvents () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = config.store
  })
  ipcMain.on(PUSH_CONFIG, (e, cfg: Config) => {
    batchUpdateConfig(cfg, false)
  })
  ipcMain.on(CLOSE_SETTINGS_WINDOW, (e, cfg: Config | undefined) => {
    if (cfg != null) {
      batchUpdateConfig(cfg, true)
    }
  })
}

export const config = (() => {
  const store = new Store<Config>({
    name: 'config',
    cwd: 'apt-data',
    defaults: defaultConfig
  })
  const config = store.store

  if (forbidden.includes(config.priceCheckLocked as string)) { config.priceCheckLocked = null }
  if (forbidden.includes(config.wikiKey as string)) { config.wikiKey = null }
  if (forbidden.includes(config.craftOfExileKey as string)) { config.craftOfExileKey = null }
  if (forbidden.includes(config.mapCheckKey as string)) { config.mapCheckKey = null }
  if (config.priceCheckKeyHold === 'Ctrl' && forbiddenCtrl.includes(config.priceCheckKey as string)) {
    config.priceCheckKey = null
  }
  for (const c of config.commands) {
    if (forbidden.includes(c.hotkey as string)) { c.hotkey = null }
  }

  if (typeof config.fontSize !== 'number') {
    config.fontSize = defaultConfig.fontSize
  }

  { // config.configVersion < 2 (undefined)
    const mapWidget = config.widgets.find(w => w.wmType === 'map-check')!
    if (mapWidget.wmZorder !== 'exclusive') {
      mapWidget.wmZorder = 'exclusive'
      mapWidget.selectedStats = mapWidget.selectedStats.map((legacy: { text: string, markedAs: string }) => ({
        matchRef: legacy.text,
        invert: false,
        valueWarning: legacy.markedAs === 'warning' ? '+' : '',
        valueDanger: legacy.markedAs === 'danger' ? '+' : '',
        valueDesirable: legacy.markedAs === 'desirable' ? '+' : ''
      }))
    }
  }

  if (config.configVersion < 3) {
    config.widgets.push({
      ...defaultConfig.widgets.find(w => w.wmType === 'image-strip')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1,
      wmZorder: null
    })

    config.widgets.push({
      ...defaultConfig.widgets.find(w => w.wmType === 'delve-grid')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1,
      wmZorder: null
    })

    config.widgets.find(w => w.wmType === 'menu')!
      .alwaysShow = false

    config.configVersion = 3
  }

  if (config.configVersion < 4) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .chaosPriceThreshold = 0.05

    const mapCheck = config.widgets.find(w => w.wmType === 'map-check')!
    ;(mapCheck as any).selectedStats.forEach((e: any) => {
      e.matcher = e.matchRef
      e.matchRef = undefined
    })

    const imgStrip = config.widgets.find(w => w.wmType === 'image-strip')!
    ;(imgStrip as any).images.forEach((e: any, idx: number) => {
      e.id = idx
    })

    config.configVersion = 4
  }

  store.store = config
  return store
})()

export function batchUpdateConfig (newCfg: Config, push = true) {
  const oldCfg = config.store
  Object.setPrototypeOf(oldCfg, Object.prototype)
  if (!isDeepEq(newCfg, oldCfg)) {
    config.store = newCfg
    logger.verbose('Saved', { source: 'config', push })
    if (push) {
      overlayWindow!.webContents.send(PUSH_CONFIG, newCfg)
    }
    if (oldCfg.clientLog !== newCfg.clientLog) {
      LogWatcher.start()
    }
  }
}
