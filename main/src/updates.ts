import { autoUpdater } from 'electron-updater'
import { logger } from './logger'
import { rebuildTrayMenu } from './tray'
import { overlayReady, overlaySendEvent } from './overlay-window'
import { config } from './config'

export const UpdateState = {
  canCheck: true,
  status: ''
}

autoUpdater.on('update-available', async (info: { version: string }) => {
  UpdateState.canCheck = false
  if (autoUpdater.autoDownload) {
    UpdateState.status = `下载 v${info.version} 版本`
  } else {
    UpdateState.status = `从Github更新到 v${info.version} 版本`
    await overlayReady
    overlaySendEvent({
      name: 'MAIN->OVERLAY::update-available',
      payload: { auto: false, version: info.version }
    })
  }
  rebuildTrayMenu()
})

autoUpdater.on('update-not-available', () => {
  UpdateState.canCheck = true
  UpdateState.status = '无可用更新'
  rebuildTrayMenu()
})

autoUpdater.on('error', () => {
  UpdateState.canCheck = true
  UpdateState.status = '出错了,请检查日志'
  rebuildTrayMenu()
})

autoUpdater.on('update-downloaded', async (info: { version: string }) => {
  UpdateState.canCheck = false
  UpdateState.status = `v${info.version} 版本将在退出后安装`
  rebuildTrayMenu()
  await overlayReady
  overlaySendEvent({
    name: 'MAIN->OVERLAY::update-available',
    payload: { auto: true, version: info.version }
  })
})

// on('download-progress') https://github.com/electron-userland/electron-builder/issues/2521

export async function checkForUpdates () {
  autoUpdater.logger = logger
  autoUpdater.autoDownload = (
    !process.env.PORTABLE_EXECUTABLE_DIR && // https://www.electron.build/configuration/nsis.html#portable
    !config.get('disableUpdateDownload')
  )

  if (!UpdateState.canCheck) return
  UpdateState.canCheck = false
  UpdateState.status = '检查更新'
  rebuildTrayMenu()

  try {
    await autoUpdater.checkForUpdates()
  } catch {
    // handled by event
  }
}
