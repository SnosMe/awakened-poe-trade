import path from 'path'
import { app, Tray, Menu, shell, nativeImage, dialog } from 'electron'

export class AppTray {
  public overlayKey = 'Shift + Space'
  private tray: Tray
  serverPort = 0

  constructor () {
    this.tray = new Tray(
      nativeImage.createFromPath(path.join(__dirname, process.env.STATIC!, process.platform === 'win32' ? 'icon.ico' : 'icon.png'))
    )
    this.tray.setToolTip('Awakened PoE Trade')
    this.rebuildMenu()
  }

  rebuildMenu () {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings/League',
        click: () => {
          dialog.showMessageBox({
            title: 'Settings',
            message: `Open Path of Exile and press "${this.overlayKey}". Click on the button with cog icon there.`
          })
        }
      },
      {
        label: 'Open in Browser',
        click: () => {
          shell.openExternal(`http://localhost:${this.serverPort}`)
        }
      },
      { type: 'separator' },
      {
        label: `APT v${app.getVersion()}`,
        click: () => {
          shell.openExternal('https://github.com/SnosMe/awakened-poe-trade/releases')
        }
      },
      {
        label: 'Open logs folder',
        click: () => {
          shell.openPath(path.join(app.getPath('userData'), 'apt-data'))
        }
      },
      { type: 'separator' },
      {
        label: 'Patreon (Donate)',
        click: () => {
          shell.openExternal('https://patreon.com/awakened_poe_trade')
        }
      },
      {
        label: 'Discord',
        submenu: [
          {
            label: 'The Forbidden Trove',
            click: () => { shell.openExternal('https://discord.gg/KNpmhvk') }
          },
          {
            label: 'r/pathofexile',
            click: () => { shell.openExternal('https://discord.gg/fSwfqN5') }
          }
        ]
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }
}
