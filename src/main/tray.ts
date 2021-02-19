import path from 'path'
import { app, Tray, Menu, ipcMain, MenuItem, MenuItemConstructorOptions, shell, nativeImage } from 'electron'
import { checkForUpdates, UpdateState } from './updates'
import { config } from './config'
import { overlayWindow } from './overlay-window'
import { League } from '@/ipc/types'
import { LEAGUES_READY, LEAGUE_SELECTED } from '@/ipc/ipc-event'
import { createWindow as settingsWindow } from './SettingsWindow'
import { logger } from './logger'

let tray: Tray
export let isQuiting = false

export let leagues: League[] = []

function selectLeague (league: League) {
  logger.info('League selected', { source: 'config', leagueId: league.id })
  config.set('leagueId', league.id)

  leagues.forEach(league => { league.selected = false })
  league.selected = true
  rebuildContextMenu()

  overlayWindow!.webContents.send(LEAGUE_SELECTED, league.id)
}

function leaguesMenuItem () {
  if (!leagues.length) return []

  const menuItem = new MenuItem({
    label: 'League',
    submenu: leagues.map<MenuItemConstructorOptions>(league => ({
      label: league.id,
      type: 'checkbox',
      checked: league.selected,
      click: () => { selectLeague(league) }
    }))
  })

  return [menuItem]
}

export function createTray () {
  tray = new Tray(
    nativeImage.createFromPath(path.join(__static, process.platform === 'win32' ? 'icon.ico' : 'icon.png'))
  )

  ipcMain.on(LEAGUES_READY, (e, leagues_: League[]) => {
    leagues = leagues_
    const selected = leagues.find(league => league.selected)!.id
    config.set('leagueId', selected)
    rebuildContextMenu()

    logger.info('Leagues ready', { source: 'init', leagues, selected })
  })

  tray.setToolTip('Awakened PoE Trade')
  rebuildContextMenu()
}

export function rebuildContextMenu () {
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
      label: 'Open data folder',
      click: () => {
        shell.openPath(path.join(app.getPath('userData'), 'apt-data'))
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
        isQuiting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}
