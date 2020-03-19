export interface League {
  id: string
  selected: boolean
}

export interface Config {
  leagueId?: string
  priceCheckKey: string
  priceCheckKeyHold: string
  priceCheckLocked?: string
  wikiKey?: string
  commands: Array<{
    text: string
    hotkey?: string
  }>
  altTabToGame: boolean
  useOsGlobalShortcut: boolean
  windowTitle: string
  logLevel: string
  showSeller: false | 'account' | 'ign'
}

export const defaultConfig: Config = {
  priceCheckKey: 'D',
  priceCheckKeyHold: 'Ctrl',
  priceCheckLocked: 'Ctrl + Alt + D',
  wikiKey: 'Alt + W',
  commands: [{
    text: '/hideout',
    hotkey: 'F5'
  }, {
    text: '/exit',
    hotkey: 'F9'
  }],
  altTabToGame: true,
  useOsGlobalShortcut: true,
  windowTitle: 'Path of Exile',
  logLevel: 'warn',
  showSeller: false
}
