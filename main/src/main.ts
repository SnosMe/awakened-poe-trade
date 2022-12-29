'use strict'

import { app, protocol } from 'electron'
import { setupShortcuts } from './shortcuts'
import { createTray } from './tray'
import { setupShowHide } from './price-check'
import { setupConfigEvents, config } from './config'
import { logger } from './logger'
import { checkForUpdates } from './updates'
import os from 'os'
import { createOverlayWindow } from './overlay-window'
import { setupAltVisibility } from './alt-visibility'
import { createFileProtocol } from './app-file-protocol'
import { LogWatcher } from './LogWatcher'
import { loadAndCache as loadAndCacheGameCfg } from './game-config'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }])
if (!config.get('hardwareAcceleration')) {
  app.disableHardwareAcceleration()
}

app.enableSandbox()

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

  checkForUpdates()
  setInterval(checkForUpdates, 16 * 60 * 60 * 1000)
})
