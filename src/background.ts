'use strict'

import { app, protocol, ipcMain, screen } from 'electron'
import { installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import { setupShortcuts } from './main/shortcuts'
import { createTray } from './main/tray'
import { setupShowHide } from './main/positioning'
import { setupConfigEvents, config } from './main/config'
import { CLOSE_SETTINGS_WINDOW } from '@/ipc/ipc-event'
import { closeWindow as closeSettings } from './main/SettingsWindow'
import { logger } from './main/logger'
import os from 'os'
import { createOverlayWindow } from './main/overlay-window'
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
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  setupConfigEvents()
  createTray()
  setupShowHide()

  setTimeout(
    async () => {
      await createOverlayWindow()
      setupShortcuts()
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )

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
