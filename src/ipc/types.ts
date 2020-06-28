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
  overlayKey: string
  overlayBackground: string
  overlayBackgroundExclusive: boolean
  overlayBackgroundClose: boolean
  priceCheckShowCursor: boolean
  mapCheckKey: string | null
  commands: Array<{
    text: string
    hotkey: string | null
  }>
  useOsGlobalShortcut: boolean
  windowTitle: string
  logLevel: string
  showSeller: false | 'account' | 'ign'
  hardwareAcceleration: boolean
  accountName: string
  searchStatRange: number
  stashScroll: boolean
  subdomain: string
  widgets: Widget[]
  fontSize: number
}

interface Widget {
  wmId: number
  wmType: string
  wmTitle: string
  wmWants: 'show' | 'hide'
  wmZorder: number | 'exclusive' | undefined
  wmFlags: (WidgetWellKnownFlag | string)[]
  // ---------------
  [key: string]: any
}

type WidgetWellKnownFlag =
  'uninitialized' |
  'skip-menu' |
  'has-browser' |
  'invisible-on-blur' |
  'hide-on-blur' |
  'hide-on-blur(close)'

export const defaultConfig: Config = {
  priceCheckKey: 'D',
  priceCheckKeyHold: 'Ctrl',
  priceCheckLocked: 'Ctrl + Alt + D',
  wikiKey: 'Alt + W',
  overlayKey: 'Shift + Space',
  overlayBackground: 'rgba(255, 255, 255, 0.15)',
  overlayBackgroundExclusive: true,
  overlayBackgroundClose: true,
  priceCheckShowCursor: true,
  mapCheckKey: null,
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
  useOsGlobalShortcut: true,
  windowTitle: 'Path of Exile',
  logLevel: 'warn',
  showSeller: false,
  hardwareAcceleration: false,
  accountName: '',
  searchStatRange: 10,
  stashScroll: true,
  subdomain: 'us',
  fontSize: 16,
  widgets: [
    // --- REQUIRED ---
    {
      wmId: 1,
      wmType: 'menu',
      wmTitle: '',
      wmWants: 'show',
      wmZorder: 1,
      wmFlags: ['invisible-on-blur', 'skip-menu'],
      anchor: {
        pos: 'tl',
        x: 5,
        y: 5
      }
    },
    {
      wmId: 2,
      wmType: 'price-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['hide-on-blur', 'skip-menu']
    },
    {
      wmId: 3,
      wmType: 'map-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 3,
      wmFlags: ['hide-on-blur', 'skip-menu'],
      selectedStats: [
        {
          text: 'Slaying Enemies close together has a #% chance to attract monsters from Beyond',
          markedAs: 'desirable'
        },
        {
          text: '#% maximum Player Resistances',
          markedAs: 'warning'
        },
        {
          text: 'Monsters reflect #% of Physical Damage',
          markedAs: 'danger'
        },
        {
          text: 'Area contains two Unique Bosses',
          markedAs: 'desirable'
        }
      ]
    },
    // --- DEFAULT ---
    {
      wmId: 4,
      wmType: 'stash-search',
      wmTitle: 'Map rolling',
      wmWants: 'hide',
      wmZorder: 4,
      wmFlags: ['invisible-on-blur'],
      anchor: {
        pos: 'tl',
        x: 35,
        y: 46
      },
      entries: [
        { id: 1, text: '"Pack Size: +3"' },
        { id: 2, text: 'Reflect' },
        { id: 3, text: '"Cannot Leech Life"' },
        { id: 4, text: '"Cannot Leech Mana"' }
      ]
    },
    {
      wmId: 5,
      wmType: 'stash-search',
      wmTitle: 'Dump sorting',
      wmWants: 'hide',
      wmZorder: 5,
      wmFlags: ['invisible-on-blur'],
      anchor: {
        pos: 'tl',
        x: 34,
        y: 56
      },
      entries: [
        { id: 1, text: 'Currency' },
        { id: 2, text: '"Divination Card"' },
        { id: 3, text: 'Fossil' },
        { id: 4, text: '"Map Tier"' },
        { id: 5, text: '"Map Device" "Rarity: Normal"' },
        { id: 6, text: 'Tane Laboratory' }
      ]
    }
  ]
}
