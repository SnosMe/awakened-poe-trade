export interface League {
  id: string
  selected: boolean
}

export interface Config {
  leagueId?: string
  priceCheckKey: string
  priceCheckKeyHold: string
  priceCheckLocked: string
  commands: Array<{
    text: string
    hotkey: string
  }>
  altTabToGame: boolean
}

export const defaultConfig: Config = {
  priceCheckKey: 'D',
  priceCheckKeyHold: 'Ctrl',
  priceCheckLocked: 'Ctrl + Alt + D',
  commands: [{
    text: '/hideout',
    hotkey: 'F5'
  }, {
    text: '/exit',
    hotkey: 'F12'
  }],
  altTabToGame: true
}
