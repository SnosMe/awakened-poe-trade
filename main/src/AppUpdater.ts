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
        // this.status = `下载 v${info.version} 版本`
      } else {
        // this.status = `从Github更新到 v${info.version} 版本`
        this.server.sendEventTo('broadcast', {
          name: 'MAIN->CLIENT::update-available',
          payload: { auto: false, version: info.version }
        })
      }
    })

    autoUpdater.on('update-not-available', () => {
      this.canCheck = true
      // this.status = '无可用更新'
    })

    autoUpdater.on('error', () => {
      this.canCheck = true
      // this.status = '出错了,请检查日志'
    })

    autoUpdater.on('update-downloaded', async (info: { version: string }) => {
      this.canCheck = false
      // this.status = `v${info.version} 版本将在退出后安装`
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->CLIENT::update-available',
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
    // this.status = '检查更新'

    try {
      await autoUpdater.checkForUpdates()
    } catch {
      // handled by event
    }
  }
}
