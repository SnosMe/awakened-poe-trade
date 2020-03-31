export interface League {
  id: string
  selected: boolean
}

export interface Config {
  leagueId?: string
  priceCheckKey: string | null
  priceCheckKeyHold: string
  priceCheckLocked: string | null
  wikiKey: string | null
  commands: Array<{
    text: string
    hotkey: string | null
  }>
  altTabToGame: boolean
  useOsGlobalShortcut: boolean
  windowTitle: string
  logLevel: string
  showSeller: false | 'account' | 'ign'
  hardwareAcceleration: boolean
  accountName: string
  searchStatRange: number
  stashScroll: boolean
  subdomain: string
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
  }, {
    text: '@last ty',
    hotkey: null
  }, {
    text: '/invite @last',
    hotkey: null
  }, {
    text: '/tradewith @last',
    hotkey: null
  }, {
    text: '/hideout @last',
    hotkey: null
  }],
  altTabToGame: true,
  useOsGlobalShortcut: true,
  windowTitle: 'Path of Exile',
  logLevel: 'warn',
  showSeller: false,
  hardwareAcceleration: false,
  accountName: '',
  searchStatRange: 10,
  stashScroll: true,
  subdomain: 'us'
}
