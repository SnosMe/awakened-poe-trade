import path from 'path'
import { app, Tray, Menu, ipcMain, MenuItem, MenuItemConstructorOptions, shell, nativeImage } from 'electron'
import { checkForUpdates } from './updates'
import { config } from './config'
import { win } from './window'
import { League } from '@/shared/types'
import { LEAGUES_READY, LEAGUE_SELECTED } from '@/shared/ipc-event'
import { createWindow as settingsWindow } from './SettingsWindow'

let tray: Tray

export let leagues: League[] = []

function selectLeague (league: League) {
  config.set('leagueId', league.id)

  leagues.forEach(league => { league.selected = false })
  league.selected = true
  rebuildContextMenu()

  win.webContents.send(LEAGUE_SELECTED, league.id)
}

function leaguesMenuItem () {
  if (!leagues.length) return []

  const menuItem = new MenuItem({
    label: 'League',
    submenu: leagues.map(league => ({
      label: league.id,
      type: 'checkbox',
      checked: league.selected,
      click: () => { selectLeague(league) }
    } as MenuItemConstructorOptions))
  })

  return [menuItem]
}

export function createTray () {
  tray = new Tray(path.join(__static, 'icon.png')) // @TODO .ico for windows

  ipcMain.on(LEAGUES_READY, (e, leagues_: League[]) => {
    leagues = leagues_
    config.set('leagueId', leagues.find(league => league.selected)!.id)
    rebuildContextMenu()
  })

  tray.setToolTip('Awakened PoE Trade')
  rebuildContextMenu()
}

function rebuildContextMenu () {
  const contextMenu = Menu.buildFromTemplate([
    ...leaguesMenuItem(),
    {
      label: 'Settings',
      click: () => {
        settingsWindow()
      }
    },
    { type: 'separator' },
    {
      label: 'Check for updates',
      click: () => {
        checkForUpdates(true)
      }
    },
    {
      label: 'Open data folder',
      click: () => {
        shell.openItem(path.join(app.getPath('userData'), 'apt-data'))
      }
    },
    { type: 'separator' },
    {
      label: 'Patreon',
      click: () => {
        shell.openExternal('https://patreon.com/awakened_poe_trade')
      }
    },
    {
      label: 'Discord',
      click: () => {
        shell.openExternal('https://discord.gg/hXgSDS6')
      }
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
