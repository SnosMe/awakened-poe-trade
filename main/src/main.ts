'use strict'

import { app } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { startServer, eventPipe } from './server'
import { Logger } from './RemoteLogger'
import { GameWindow } from './windowing/GameWindow'
import { OverlayWindow } from './windowing/OverlayWindow'
import { GameConfig } from './host-files/GameConfig'
import { Shortcuts } from './shortcuts/Shortcuts'
import { AppUpdater } from './AppUpdater'
import { AppTray } from './AppTray'
import { OverlayVisibility } from './windowing/OverlayVisibility'
import { GameLogWatcher } from './host-files/GameLogWatcher'

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

app.enableSandbox()

let tray: AppTray

app.on('ready', async () => {
  tray = new AppTray()
  const logger = new Logger(eventPipe)
  const gameLogWatcher = new GameLogWatcher(eventPipe, logger)
  const gameConfig = new GameConfig(eventPipe, logger)
  const poeWindow = new GameWindow()
  const appUpdater = new AppUpdater(eventPipe)

  setTimeout(
    async () => {
      const overlay = new OverlayWindow(eventPipe, logger, poeWindow)
      new OverlayVisibility(eventPipe, overlay, gameConfig)
      const shortcuts = new Shortcuts(logger, overlay, poeWindow, gameConfig, eventPipe)
      eventPipe.onEventAnyClient('CLIENT->MAIN::update-host-config', (cfg) => {
        overlay.updateOpts(cfg.overlayKey, cfg.windowTitle)
        shortcuts.updateActions(cfg.shortcuts, cfg.stashScroll, cfg.restoreClipboard)
        gameLogWatcher.restart(cfg.clientLog)
        gameConfig.readConfig(cfg.gameConfig)
        appUpdater.updateOps(!cfg.disableUpdateDownload)
        tray.overlayKey = cfg.overlayKey
      })
      uIOhook.start()
      const port = await startServer()
      overlay.loadAppPage(port)
      tray.serverPort = port
    },
    // fixes(linux): window is black instead of transparent
    process.platform === 'linux' ? 1000 : 0
  )
})
