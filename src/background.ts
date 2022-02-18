'use strict'

import { app, protocol } from 'electron'
import { setupShortcuts } from './main/shortcuts'
import { createTray } from './main/tray'
import { setupShowHide } from './main/price-check'
import { setupConfigEvents, config } from './main/config'
import { logger } from './main/logger'
import { checkForUpdates } from './main/updates'
import os from 'os'
import { createOverlayWindow } from './main/overlay-window'
import { setupAltVisibility } from './main/alt-visibility'
import { createFileProtocol } from './main/app-file-protocol'
import { LogWatcher } from './main/LogWatcher'
import { loadAndCache as loadAndCacheGameCfg } from './main/game-config'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }])
if (!config.get('hardwareAcceleration')) {
  app.disableHardwareAcceleration()
}

app.on('ready', async () => {
  logger.info('App is running', {
    source: 'init',
    version: app.getVersion(),
    osName: os.type(),
    osRelease: os.release(),
    logLevel: logger.level
  })

  createFileProtocol()

  setupConfigEvents()
  createTray()
  setupShowHide()
  loadAndCacheGameCfg()

  setTimeout(
    async () => {
      await createOverlayWindow()
      setupShortcuts()
      setupAltVisibility()
      LogWatcher.start()
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )

  if (process.env.NODE_ENV === 'production') {
    checkForUpdates()
  }
})
