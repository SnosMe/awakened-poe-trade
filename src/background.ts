'use strict'

import { app, protocol, ipcMain, screen } from 'electron'
import { installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import { setupShortcuts } from './main/shortcuts'
import { setupWindowManager } from './main/window-manager'
import { createTray } from './main/tray'
import { createWindow } from './main/window'
import { setupShowHide } from './main/positioning'
import { setupConfig, batchUpdateConfig, config } from './main/config'
import { CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { closeWindow as closeSettings } from './main/SettingsWindow'
import { PoeWindow } from './main/PoeWindow'
import { logger } from './main/logger'
import os from 'os'
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
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  await setupWindowManager()
  PoeWindow.startPolling()
  setupConfig()
  setupShowHide()
  setTimeout(
    createWindow, // fix: linux window black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )
  createTray()
  setupShortcuts()

  ipcMain.on(CLOSE_SETTINGS_WINDOW, closeSettings)
  ipcMain.on(CLOSE_SETTINGS_WINDOW, (e, cfg) => {
    if (cfg != null) {
      batchUpdateConfig(cfg)
    }
  })
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
