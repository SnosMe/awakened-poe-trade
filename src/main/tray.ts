import path from 'path'
import { app, Tray, Menu, ipcMain, MenuItem, MenuItemConstructorOptions } from 'electron'
import { checkForUpdates } from './updates'
import { config } from './config'
import { win } from './window'
import { League } from '@/shared/types'
import { LEAGUES_READY, LEAGUE_SELECTED } from '@/shared/ipc-event'

let tray: Tray

let leagues: League[] = []

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

  tray.setContextMenu(contextMenu)
}
