import path from 'path'
import { BrowserWindow, dialog } from 'electron'
import { isInteractable } from './overlay-window'
import { config } from './config'

let settingsWindow: BrowserWindow | undefined

export function createWindow () {
  if (isInteractable) {
    dialog.showErrorBox(
      'Settings - Possible data loss',
      // ----------------------
      'Settings cannot be opened when overlay is active.\n' +
      '\n' +
      'This prevents the loss of any changes made in overlay window.'
    )
    return
  }

  if (settingsWindow) {
    try {
      settingsWindow.focus()
    } catch {
      settingsWindow = undefined
      createWindow()
    }
    return
  }

  settingsWindow = new BrowserWindow({
    width: 50 * config.get('fontSize'),
    height: 37.5 * config.get('fontSize'),
    icon: path.join(__static, 'icon.png'),
    fullscreenable: false,
    frame: false,
    backgroundColor: '#2d3748', // gray-800
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      defaultFontSize: config.get('fontSize')
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    settingsWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#settings/hotkeys')
  } else {
    settingsWindow.loadURL('app://./index.html#settings/hotkeys')
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow!.show()
  })
}

export function closeWindow () {
  if (settingsWindow) {
    settingsWindow.close()
    settingsWindow = undefined
  }
}
