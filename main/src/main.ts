"use strict";

import { app, systemPreferences } from "electron";
import { uIOhook } from "uiohook-napi";
import os from "node:os";
import { startServer, eventPipe, server } from "./server";
import { Logger } from "./RemoteLogger";
import { GameWindow } from "./windowing/GameWindow";
import { OverlayWindow } from "./windowing/OverlayWindow";
import { GameConfig } from "./host-files/GameConfig";
import { Shortcuts } from "./shortcuts/Shortcuts";
import { AppUpdater } from "./AppUpdater";
import { AppTray } from "./AppTray";
import { OverlayVisibility } from "./windowing/OverlayVisibility";
import { GameLogWatcher } from "./host-files/GameLogWatcher";
import { HttpProxy } from "./proxy";
import { installExtension, VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { FilterGenerator } from "./filter-generator/FilterGenerator";

if (!app.requestSingleInstanceLock()) {
  app.exit();
}

if (process.platform !== "darwin") {
  app.disableHardwareAcceleration();
}
app.enableSandbox();
let tray: AppTray;

// Ensure accessibility permissions on MacOS.
if (process.platform === "darwin") {
  (async () => {
    async function ensureAccessibilityPermission(): Promise<boolean> {
      if (systemPreferences.isTrustedAccessibilityClient(false)) return true;

      // Trigger the system prompt
      systemPreferences.isTrustedAccessibilityClient(true);

      const maxWaitTime = 15000; // 15 seconds
      const startTime = Date.now();

      return await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (systemPreferences.isTrustedAccessibilityClient(false)) {
            clearInterval(interval);
            resolve(true);
          }

          // Stop waiting if time runs out
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(interval);
            resolve(false);
          }
        }, 1000);
      });
    }
    const hasPermission = await ensureAccessibilityPermission();
    if (!hasPermission) {
      console.warn("Accessibility permission not granted, exiting");
      app.quit();
      return;
    }
    console.log("Accessibility permission granted, starting app");
    app.on("ready", async () => {
      tray = new AppTray(eventPipe);
      const logger = new Logger(eventPipe);
      const gameLogWatcher = new GameLogWatcher(eventPipe, logger);
      const gameConfig = new GameConfig(eventPipe, logger);
      const poeWindow = new GameWindow();
      const appUpdater = new AppUpdater(eventPipe);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _httpProxy = new HttpProxy(server, logger);

      if (process.env.VITE_DEV_SERVER_URL) {
        try {
          await installExtension(VUEJS_DEVTOOLS);
          logger.write("info Vue Devtools installed");
        } catch (error) {
          logger.write(`error installing Vue Devtools: ${error}`);
          console.log(`error installing Vue Devtools: ${error}`);
        }
      }

      setTimeout(
        async () => {
          const overlay = new OverlayWindow(eventPipe, logger, poeWindow);
          // eslint-disable-next-line no-new
          new OverlayVisibility(eventPipe, overlay, gameConfig);
          const shortcuts = await Shortcuts.create(
            logger,
            overlay,
            poeWindow,
            gameConfig,
            eventPipe,
          );
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const filterGenerator = new FilterGenerator(
            logger,
            gameConfig,
            eventPipe,
          );
          eventPipe.onEventAnyClient(
            "CLIENT->MAIN::update-host-config",
            (cfg) => {
              overlay.updateOpts(cfg.overlayKey, cfg.windowTitle);
              shortcuts.updateActions(
                cfg.shortcuts,
                cfg.stashScroll,
                cfg.logKeys,
                cfg.restoreClipboard,
                cfg.language,
              );
              gameLogWatcher.restart(cfg.clientLog ?? "");
              gameConfig.readConfig(cfg.gameConfig ?? "");
              appUpdater.checkAtStartup();
              tray.overlayKey = cfg.overlayKey;
            },
          );
          uIOhook.start();
          console.log("uIOhook started");
          const port = await startServer(appUpdater, logger);
          // TODO: move up (currently crashes)
          logger.write(
            `info ${os.type()} ${os.release} / v${app.getVersion()}`,
          );
          overlay.loadAppPage(port);
          tray.serverPort = port;
        },
        // fixes(linux): window is black instead of transparent
        process.platform === "linux" ? 1000 : 0,
      );
    });
  })();
} else {
  app.on("ready", async () => {
    tray = new AppTray(eventPipe);
    const logger = new Logger(eventPipe);
    const gameLogWatcher = new GameLogWatcher(eventPipe, logger);
    const gameConfig = new GameConfig(eventPipe, logger);
    const poeWindow = new GameWindow();
    const appUpdater = new AppUpdater(eventPipe);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _httpProxy = new HttpProxy(server, logger);

    if (process.env.VITE_DEV_SERVER_URL) {
      try {
        await installExtension(VUEJS_DEVTOOLS);
        logger.write("info Vue Devtools installed");
      } catch (error) {
        logger.write(`error installing Vue Devtools: ${error}`);
        console.log(`error installing Vue Devtools: ${error}`);
      }
    }

    setTimeout(
      async () => {
        const overlay = new OverlayWindow(eventPipe, logger, poeWindow);
        // eslint-disable-next-line no-new
        new OverlayVisibility(eventPipe, overlay, gameConfig);
        const shortcuts = await Shortcuts.create(
          logger,
          overlay,
          poeWindow,
          gameConfig,
          eventPipe,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const filterGenerator = new FilterGenerator(
          logger,
          gameConfig,
          eventPipe,
        );
        eventPipe.onEventAnyClient(
          "CLIENT->MAIN::update-host-config",
          (cfg) => {
            overlay.updateOpts(cfg.overlayKey, cfg.windowTitle);
            shortcuts.updateActions(
              cfg.shortcuts,
              cfg.stashScroll,
              cfg.logKeys,
              cfg.restoreClipboard,
              cfg.language,
            );
            gameLogWatcher.restart(cfg.clientLog ?? "");
            gameConfig.readConfig(cfg.gameConfig ?? "");
            appUpdater.checkAtStartup();
            tray.overlayKey = cfg.overlayKey;
          },
        );
        uIOhook.start();
        console.log("uIOhook started");
        const port = await startServer(appUpdater, logger);
        // TODO: move up (currently crashes)
        logger.write(`info ${os.type()} ${os.release} / v${app.getVersion()}`);
        overlay.loadAppPage(port);
        tray.serverPort = port;
      },
      // fixes(linux): window is black instead of transparent
      process.platform === "linux" ? 1000 : 0,
    );
  });
}
