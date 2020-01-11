import path from 'path'
import { app, Tray, Menu } from 'electron'
import { checkForUpdates } from './updates'

let tray: Tray

export function createTray () {
  tray = new Tray(path.join(__static, 'icon.png')) // @TODO .ico for windows

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Check for updates',
      click: () => {
        checkForUpdates()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Awakened PoE Trade')
  tray.setContextMenu(contextMenu)
}
