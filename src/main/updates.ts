import { autoUpdater } from 'electron-updater'
import { Notification } from 'electron'
import { logger } from './logger'

let _manual = false

autoUpdater.on('update-available', () => {
  new Notification({
    title: 'Awakened PoE Trade',
    body: 'New update found and is downloading in the background now'
  }).show()

  logger.info('Update is downloading', { source: 'updater' })
})

autoUpdater.on('update-not-available', () => {
  if (_manual) {
    new Notification({
      title: 'Awakened PoE Trade',
      body: 'You already have the latest version'
    }).show()
  }

  logger.info('No updates available', { source: 'updater' })
})

export async function checkForUpdates (manual: boolean = false) {
  if (process.platform === 'darwin') return

  _manual = manual
  autoUpdater.checkForUpdatesAndNotify()

  logger.info('Checking for updates', { source: 'updater', manual })
}
