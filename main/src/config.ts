import Store from 'electron-store'
import { dialog, app } from 'electron'
import isDeepEq from 'fast-deep-equal'
import { Config, defaultConfig } from '../../ipc/types'
import { logger } from './logger'
import { LogWatcher } from './LogWatcher'
import { ItemCheckWidget } from '../../ipc/widgets'
import { loadAndCache as loadAndCacheGameCfg } from './game-config'
import { overlayOnEvent } from './overlay-window'

export function setupConfigEvents () {
  overlayOnEvent('OVERLAY->MAIN::get-config', (e) => {
    e.returnValue = config.store
  })
  overlayOnEvent('OVERLAY->MAIN::save-config', (_, cfg) => {
    batchUpdateConfig(cfg)
  })
}

export const config = (() => {
  const store = new Store<Config>({
    name: 'config',
    cwd: 'apt-data',
    defaults: defaultConfig()
  })

  if (store.get('configVersion') > defaultConfig().configVersion) {
    dialog.showErrorBox(
      'Awakened PoE Trade - Incompatible configuration',
      // ----------------------
      'You are trying to use an older version of Awakened PoE Trade with a newer incompatible configuration file.\n' +
      'You need to install the latest version to continue using it.'
    )
    app.exit(1)
  }

  store.store = upgradeConfig(store.store)
  return store
})()

export function batchUpdateConfig (newCfg: Config) {
  const oldCfg = config.store
  Object.setPrototypeOf(oldCfg, Object.prototype)
  if (!isDeepEq(newCfg, oldCfg)) {
    config.store = newCfg
    logger.verbose('Saved.', { source: 'config' })
    if (oldCfg.clientLog !== newCfg.clientLog) {
      LogWatcher.start()
    }
    if (oldCfg.gameConfig !== newCfg.gameConfig) {
      loadAndCacheGameCfg()
    }
  }
}

function upgradeConfig (_config: Config): Config {
  const config = _config as Omit<Config, 'widgets'> & { widgets: Array<Record<string, any>> }

  if (config.configVersion < 3) {
    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'image-strip')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1,
      wmZorder: null
    })

    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'delve-grid')!,
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

  if (config.configVersion < 10) {
    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'settings')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1
    })

    const priceCheck = config.widgets.find(w => w.wmType === 'price-check')!
    priceCheck.hotkey = (config as any).priceCheckKey
    priceCheck.hotkeyHold = (config as any).priceCheckKeyHold
    priceCheck.hotkeyLocked = (config as any).priceCheckLocked
    priceCheck.showSeller = (config as any).showSeller
    priceCheck.searchStatRange = (config as any).searchStatRange
    priceCheck.showCursor = (config as any).priceCheckShowCursor

    if (priceCheck.chaosPriceThreshold === 0.05) {
      priceCheck.chaosPriceThreshold = 0
    }

    config.configVersion = 10
  }

  if (config.configVersion < 11) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .requestPricePrediction = false

    config.configVersion = 11
  }

  if (config.configVersion < 12) {
    const afterSettings = config.widgets.findIndex(w => w.wmType === 'settings')
    config.widgets.splice(afterSettings + 1, 0, {
      ...defaultConfig().widgets.find(w => w.wmType === 'item-search')!,
      wmWants: 'show',
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1
    })

    config.realm = 'pc-ggg'
    if (config.language === 'zh_TW' as string) {
      config.language = 'cmn-Hant'
    }

    config.configVersion = 12
  }

  return config as unknown as Config
}