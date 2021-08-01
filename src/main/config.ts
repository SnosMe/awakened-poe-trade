import Store from 'electron-store'
import { dialog, ipcMain, app } from 'electron'
import isDeepEq from 'fast-deep-equal'
import { Config, defaultConfig } from '@/ipc/types'
import { forbidden, forbiddenCtrl } from '@/ipc/KeyToCode'
import { GET_CONFIG, PUSH_CONFIG, CLOSE_SETTINGS_WINDOW, IpcConfigs } from '@/ipc/ipc-event'
import { overlayWindow } from './overlay-window'
import { logger } from './logger'
import { LogWatcher } from './LogWatcher'
import { ItemCheckWidget } from '@/web/overlay/interfaces'
import { readConfig as readGameConfig, loadAndCache as loadAndCacheGameCfg } from './game-config'

export function setupConfigEvents () {
  ipcMain.on(GET_CONFIG, (e) => {
    e.returnValue = {
      app: config.store,
      game: readGameConfig()
    } as IpcConfigs
  })
  ipcMain.on(PUSH_CONFIG, (e, cfg: Config) => {
    batchUpdateConfig(cfg, false)
  })
  ipcMain.on(CLOSE_SETTINGS_WINDOW, (e, cfg: Config | undefined) => {
    if (cfg != null) {
      loadAndCacheGameCfg()
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

  if (config.configVersion > defaultConfig.configVersion) {
    logger.error('Incompatible configuration', { source: 'config', expected: defaultConfig.configVersion, actual: config.configVersion })
    dialog.showErrorBox(
      'Awakened PoE Trade - Incompatible configuration',
      // ----------------------
      'You are trying to use an older version of Awakened PoE Trade with a newer incompatible configuration file.\n' +
      'You need to install the latest version to continue using it.'
    )
    app.exit(1)
  }

  if (forbidden.includes(config.priceCheckLocked as string)) { config.priceCheckLocked = null }
  if (forbidden.includes(config.wikiKey as string)) { config.wikiKey = null }
  if (forbidden.includes(config.craftOfExileKey as string)) { config.craftOfExileKey = null }
  if (forbidden.includes(config.itemCheckKey as string)) { config.itemCheckKey = null }
  if (config.priceCheckKeyHold === 'Ctrl' && forbiddenCtrl.includes(config.priceCheckKey as string)) {
    config.priceCheckKey = null
  }
  for (const c of config.commands) {
    if (forbidden.includes(c.hotkey as string)) { c.hotkey = null }
  }

  if (typeof config.fontSize !== 'number') {
    config.fontSize = defaultConfig.fontSize
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

    {
      const widgets = config.widgets.filter(w => w.wmType === 'image-strip')!
      widgets.forEach((imgStrip: any) => {
        imgStrip.images.forEach((e: any, idx: number) => {
          e.id = idx
        })
      })
    }

    config.configVersion = 4
  }

  if (config.configVersion < 5) {
    config.commands.forEach(cmd => {
      cmd.send = true
    })

    config.configVersion = 5
  }

  if (config.configVersion < 6) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .showRateLimitState = (config.logLevel === 'debug')
    config.widgets.find(w => w.wmType === 'price-check')!
      .apiLatencySeconds = 2

    config.configVersion = 6
  }

  if (config.configVersion < 7) {
    const mapCheck = config.widgets.find(w => w.wmType === 'map-check')!
    mapCheck.wmType = 'item-check'
    mapCheck.maps = { selectedStats: mapCheck.selectedStats }
    mapCheck.selectedStats = undefined

    config.itemCheckKey = (config as any).mapCheckKey || null
    ;(config as any).mapCheckKey = undefined

    config.configVersion = 7
  }

  if (config.configVersion < 8) {
    const itemCheck = config.widgets.find(w => w.wmType === 'item-check')!
    ;(itemCheck as ItemCheckWidget).maps.showNewStats = false
    itemCheck.maps.selectedStats = (itemCheck as ItemCheckWidget).maps.selectedStats.map(entry => ({
      matcher: entry.matcher,
      decision:
        (entry as any).valueDanger ? 'danger'
          : (entry as any).valueWarning ? 'warning'
              : (entry as any).valueDesirable ? 'desirable'
                  : 'seen'
    }))

    config.configVersion = 8
  }

  if (config.configVersion < 9) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .collapseListings = 'api'

    config.widgets.find(w => w.wmType === 'price-check')!
      .smartInitialSearch = true
    config.widgets.find(w => w.wmType === 'price-check')!
      .lockedInitialSearch = true

    config.widgets.find(w => w.wmType === 'price-check')!
      .activateStockFilter = false

    config.configVersion = 9
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
