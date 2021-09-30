import path from 'path'
import { app, Tray, Menu, shell, nativeImage, dialog } from 'electron'
import { checkForUpdates, UpdateState } from './updates'
import { config } from './config'

let tray: Tray

export function createTray () {
  tray = new Tray(
    nativeImage.createFromPath(path.join(__static, process.platform === 'win32' ? 'icon.ico' : 'icon.png'))
  )

  tray.setToolTip('Awakened PoE Trade')
  rebuildTrayMenu()
}

export function rebuildTrayMenu () {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => {
        dialog.showMessageBox({ title: 'Settings', message: `Open Path of Exile and press "${config.get('overlayKey')}". Click on the button with cog icon there.` })
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
      label: UpdateState.canCheck ? 'Check for updates' : UpdateState.status,
      sublabel: UpdateState.canCheck ? UpdateState.status : undefined,
      enabled: UpdateState.canCheck,
      click: checkForUpdates
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
          label: 'Awakened PoE Trade',
          click: () => { shell.openExternal('https://discord.gg/hXgSDS6') }
        },
        { type: 'separator' },
        {
          label: 'Path of Exile',
          click: () => { shell.openExternal('https://discord.gg/fSwfqN5') }
        },
        {
          label: 'The Forbidden Trove',
          click: () => { shell.openExternal('https://discord.gg/KNpmhvk') }
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

  tray.setContextMenu(contextMenu)
}
