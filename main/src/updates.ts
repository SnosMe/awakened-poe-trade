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
    UpdateState.status = `Downloading v${info.version} ...`
  } else {
    UpdateState.status = `Update v${info.version} available on GitHub`
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
  UpdateState.status = 'No updates available'
  rebuildTrayMenu()
})

autoUpdater.on('error', () => {
  UpdateState.canCheck = true
  UpdateState.status = 'Something went wrong, check logs'
  rebuildTrayMenu()
})

autoUpdater.on('update-downloaded', async (info: { version: string }) => {
  UpdateState.canCheck = false
  UpdateState.status = `v${info.version} will be installed on exit`
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
  UpdateState.status = 'Checking for update...'
  rebuildTrayMenu()

  try {
    await autoUpdater.checkForUpdates()
  } catch {
    // handled by event
  }
}
