import { autoUpdater } from 'electron-updater'
import type { ServerEvents } from './server'

export class AppUpdater {
  private canCheck = true
  private checkedAtStartup = false

  constructor (
    private server: ServerEvents
  ) {
    setInterval(this.check, 16 * 60 * 60 * 1000)

    autoUpdater.on('update-available', async (info: { version: string }) => {
      this.canCheck = false
      if (autoUpdater.autoDownload) {
        // this.status = `Downloading v${info.version} ...`
      } else {
        // this.status = `Update v${info.version} available on GitHub`
        this.server.sendEventTo('broadcast', {
          name: 'MAIN->OVERLAY::update-available',
          payload: { auto: false, version: info.version }
        })
      }
    })

    autoUpdater.on('update-not-available', () => {
      this.canCheck = true
      // this.status = 'No updates available'
    })

    autoUpdater.on('error', () => {
      this.canCheck = true
      // this.status = 'Something went wrong, check logs'
    })

    autoUpdater.on('update-downloaded', async (info: { version: string }) => {
      this.canCheck = false
      // this.status = `v${info.version} will be installed on exit`
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->OVERLAY::update-available',
        payload: { auto: true, version: info.version }
      })
    })

    // on('download-progress') https://github.com/electron-userland/electron-builder/issues/2521
  }

  updateOps (autoDownload: boolean) {
    autoUpdater.autoDownload = (
      !process.env.PORTABLE_EXECUTABLE_DIR && // https://www.electron.build/configuration/nsis.html#portable
      autoDownload
    )
    if (!this.checkedAtStartup) {
      this.checkedAtStartup = true
      this.check()
    }
  }

  private check = async () => {
    if (!this.canCheck) return
    this.canCheck = false
    // this.status = 'Checking for update...'

    try {
      await autoUpdater.checkForUpdates()
    } catch {
      // handled by event
    }
  }
}
