import { ItemCheckWidget, PriceCheckWidget } from '@/web/overlay/interfaces'

export interface League {
  id: string
  selected: boolean
}

export interface Config {
  configVersion: number
  leagueId?: string
  priceCheckKey: string | null
  priceCheckKeyHold: string
  priceCheckLocked: string | null
  wikiKey: string | null
  craftOfExileKey: string | null
  overlayKey: string
  overlayBackground: string
  overlayBackgroundExclusive: boolean
  overlayBackgroundClose: boolean
  priceCheckShowCursor: boolean
  itemCheckKey: string | null
  delveGridKey: string | null
  restoreClipboard: boolean
  commands: Array<{
    text: string
    hotkey: string | null
    send: boolean
  }>
  clientLog: string | null
  gameConfig: string | null
  useOsGlobalShortcut: boolean
  windowTitle: string
  logLevel: string
  showSeller: false | 'account' | 'ign'
  hardwareAcceleration: boolean
  accountName: string
  searchStatRange: number
  stashScroll: boolean
  language: 'en' | 'ru'
  widgets: Widget[]
  fontSize: number
  disableUpdateDownload: boolean
}

interface Widget {
  wmId: number
  wmType: string
  wmTitle: string
  wmWants: 'show' | 'hide'
  wmZorder: number | 'exclusive' | null
  wmFlags: Array<WidgetWellKnownFlag | string>
  // ---------------
  [key: string]: any
}

type WidgetWellKnownFlag =
  'uninitialized' |
  'skip-menu' |
  'has-browser' |
  'invisible-on-blur' |
  'hide-on-blur' |
  'hide-on-blur(close)' |
  'hide-on-focus'

export const defaultConfig: Config = {
  configVersion: 9,
  priceCheckKey: 'D',
  priceCheckKeyHold: 'Ctrl',
  priceCheckLocked: 'Ctrl + Alt + D',
  wikiKey: 'Alt + W',
  craftOfExileKey: null,
  overlayKey: 'Shift + Space',
  overlayBackground: 'rgba(129, 139, 149, 0.15)',
  overlayBackgroundExclusive: true,
  overlayBackgroundClose: true,
  priceCheckShowCursor: true,
  itemCheckKey: null,
  delveGridKey: null,
  restoreClipboard: true,
  commands: [{
    text: '/hideout',
    hotkey: 'F5',
    send: true
  }, {
    text: '/exit',
    hotkey: 'F9',
    send: true
  }, {
    text: '@last ty',
    hotkey: null,
    send: true
  }, {
    text: '/invite @last',
    hotkey: null,
    send: true
  }, {
    text: '/tradewith @last',
    hotkey: null,
    send: true
  }, {
    text: '/hideout @last',
    hotkey: null,
    send: true
  }],
  clientLog: null,
  gameConfig: null,
  useOsGlobalShortcut: true,
  windowTitle: 'Path of Exile',
  logLevel: 'warn',
  showSeller: false,
  hardwareAcceleration: false,
  accountName: '',
  searchStatRange: 10,
  stashScroll: true,
  language: 'en',
  fontSize: 16,
  disableUpdateDownload: false,
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
      },
      alwaysShow: false
    },
    {
      wmId: 2,
      wmType: 'price-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['hide-on-blur', 'skip-menu'],
      chaosPriceThreshold: 0.05,
      showRateLimitState: false,
      apiLatencySeconds: 2,
      collapseListings: 'api',
      smartInitialSearch: true,
      lockedInitialSearch: true,
      activateStockFilter: false
    } as PriceCheckWidget,
    {
      wmId: 3,
      wmType: 'item-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['hide-on-blur', 'skip-menu'],
      maps: {
        showNewStats: false,
        selectedStats: [
          {
            matcher: 'Slaying Enemies close together has a #% chance to attract monsters from Beyond',
            decision: 'desirable'
          },
          {
            matcher: '#% maximum Player Resistances',
            decision: 'warning'
          },
          {
            matcher: 'Monsters reflect #% of Physical Damage',
            decision: 'danger'
          },
          {
            matcher: 'Monsters reflect #% of Elemental Damage',
            decision: 'danger'
          },
          {
            matcher: 'Area contains two Unique Bosses',
            decision: 'desirable'
          }
        ]
      }
    } as ItemCheckWidget,
    {
      wmId: 4,
      wmType: 'delve-grid',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 4,
      wmFlags: ['hide-on-focus', 'skip-menu']
    },
    // --- DEFAULT ---
    {
      wmId: 101,
      wmType: 'stash-search',
      wmTitle: 'Map rolling',
      wmWants: 'hide',
      wmZorder: 101,
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
      wmId: 102,
      wmType: 'stash-search',
      wmTitle: 'Dump sorting',
      wmWants: 'hide',
      wmZorder: 102,
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
    },
    {
      wmId: 103,
      wmType: 'image-strip',
      wmTitle: 'Cheat sheets',
      wmWants: 'hide',
      wmZorder: 103,
      wmFlags: ['invisible-on-blur'],
      anchor: {
        pos: 'tc',
        x: 50,
        y: 10
      },
      images: [
        { id: 1, url: 'syndicate.jpg' }
      ]
    }
  ]
}
