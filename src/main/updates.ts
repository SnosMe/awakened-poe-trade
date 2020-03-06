import { autoUpdater } from 'electron-updater'
import { Notification } from 'electron'

let _manual = false

autoUpdater.on('update-available', () => {
  new Notification({
    title: 'Awakened PoE Trade',
    body: 'New update found and is downloading in the background now'
  }).show()
})

autoUpdater.on('update-not-available', () => {
  if (_manual) {
    new Notification({
      title: 'Awakened PoE Trade',
      body: 'You already have the latest version'
    }).show()
  }
})

export async function checkForUpdates (manual: boolean = false) {
  _manual = manual
  autoUpdater.checkForUpdatesAndNotify()
}
