'use strict'

import { app, protocol, ipcMain, screen } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { setupShortcuts } from './main/shortcuts'
import { createTray } from './main/tray'
import { setupShowHide } from './main/price-check'
import { setupConfigEvents, config } from './main/config'
import { CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { closeWindow as closeSettings } from './main/SettingsWindow'
import { logger } from './main/logger'
import { checkForUpdates } from './main/updates'
import os from 'os'
import { setupCfProtection } from './main/cf-protection'
import { createOverlayWindow } from './main/overlay-window'
import { setupAltVisibility } from './main/alt-visibility'
import { setupBuiltinBrowser } from './main/builtin-browser'
import { createFileProtocol } from './main/app-file-protocol'
import { LogWatcher } from './main/LogWatcher'
import { loadAndCache as loadAndCacheGameCfg } from './main/game-config'
const isDevelopment = process.env.NODE_ENV !== 'production'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])
app.allowRendererProcessReuse = true
if (!config.get('hardwareAcceleration')) {
  app.disableHardwareAcceleration()
}

app.on('ready', async () => {
  logger.info('App is running', {
    source: 'init',
    version: app.getVersion(),
    osName: os.type(),
    osRelease: os.release(),
    logLevel: logger.level,
    displays: screen.getAllDisplays().map(d => ({
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      isPrimary: d.id === screen.getPrimaryDisplay().id
    })),
    config: config.store
  })

  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  createFileProtocol()

  setupConfigEvents()
  createTray()
  setupShowHide()
  setupBuiltinBrowser()
  loadAndCacheGameCfg()

  setTimeout(
    async () => {
      await createOverlayWindow()
      setupCfProtection()
      setupShortcuts()
      setupAltVisibility()
      LogWatcher.start()
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )

  if (!isDevelopment) {
    checkForUpdates()
  }

  ipcMain.on(CLOSE_SETTINGS_WINDOW, closeSettings)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
