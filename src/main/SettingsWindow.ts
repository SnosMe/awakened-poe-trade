import path from 'path'
import { BrowserWindow } from 'electron'

let settingsWindow: BrowserWindow | undefined

export function createWindow () {
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__static, 'icon.png'),
    fullscreenable: false,
    frame: false,
    backgroundColor: '#2d3748', // gray-800
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION as any
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    settingsWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#settings')
    // settingsWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    settingsWindow.loadURL('app://./index.html#settings')
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
