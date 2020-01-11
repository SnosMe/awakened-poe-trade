import { autoUpdater } from 'electron-updater'

export function checkForUpdates () {
  autoUpdater.checkForUpdatesAndNotify()
}
