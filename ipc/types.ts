import * as widget from './widgets'
import type { IpcEvent } from './ipc-event'

export interface PreloadExposed {
  sendEvent: (event: IpcEvent) => void
  onEvent: (cb: (data: IpcEvent) => void) => void
  getConfig: () => Config
  importFile: (filePath: string) => string
}

export interface Config {
  configVersion: number
  leagueId?: string
  wikiKey: string | null
  craftOfExileKey: string | null
  overlayKey: string
  overlayBackground: string
  overlayBackgroundExclusive: boolean
  overlayBackgroundClose: boolean
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
  windowTitle: string
  logLevel: string
  hardwareAcceleration: boolean
  accountName: string
  stashScroll: boolean
  language: 'en' | 'ru' | 'cmn-Hant' | 'zh_CN'
  realm: 'pc-ggg' | 'pc-garena' | 'pc-tencent'
  poesessid: string
  widgets: widget.Widget[]
  fontSize: number
  disableUpdateDownload: boolean
}

export const defaultConfig = (): Config => ({
  configVersion: 12,
  wikiKey: 'Alt + W',
  craftOfExileKey: null,
  overlayKey: 'Shift + Space',
  overlayBackground: 'rgba(129, 139, 149, 0.15)',
  overlayBackgroundExclusive: true,
  overlayBackgroundClose: true,
  itemCheckKey: null,
  delveGridKey: null,
  restoreClipboard: false,
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
  windowTitle: 'Path of Exile',
  logLevel: 'warn',
  hardwareAcceleration: false,
  accountName: '',
  stashScroll: true,
  language: 'en',
  realm: 'pc-ggg',
  poesessid:'',
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
    } as widget.WidgetMenu,
    {
      wmId: 2,
      wmType: 'price-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['hide-on-blur', 'skip-menu'],
      chaosPriceThreshold: 0,
      showRateLimitState: false,
      apiLatencySeconds: 2,
      collapseListings: 'api',
      smartInitialSearch: true,
      lockedInitialSearch: true,
      activateStockFilter: false,
      hotkey: 'D',
      hotkeyHold: 'Ctrl',
      hotkeyLocked: 'Ctrl + Alt + D',
      showSeller: false,
      searchStatRange: 10,
      showCursor: true,
      requestPricePrediction: false
    } as widget.PriceCheckWidget,
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
    } as widget.ItemCheckWidget,
    {
      wmId: 4,
      wmType: 'delve-grid',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 4,
      wmFlags: ['hide-on-focus', 'skip-menu']
    },
    {
      wmId: 5,
      wmType: 'settings',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['invisible-on-blur', 'ignore-ui-visibility']
    },
    {
      wmId: 6,
      wmType: 'item-search',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 6,
      wmFlags: ['invisible-on-blur'],
      anchor: {
        pos: 'tl',
        x: 10,
        y: 20
      }
    } as widget.ItemSearchWidget,
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
        { id: 1, name: '', text: '"Pack Size: +3"', hotkey: null },
        { id: 2, name: '', text: 'Reflect', hotkey: null },
        { id: 3, name: '', text: '"Cannot Leech Life"', hotkey: null },
        { id: 4, name: '', text: '"Cannot Leech Mana"', hotkey: null }
      ]
    } as widget.StashSearchWidget,
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
        { id: 1, name: '', text: 'Currency', hotkey: null },
        { id: 2, name: '', text: '"Divination Card"', hotkey: null },
        { id: 3, name: '', text: 'Fossil', hotkey: null },
        { id: 4, name: '', text: '"Map Tier"', hotkey: null },
        { id: 5, name: '', text: '"Map Device" "Rarity: Normal"', hotkey: null },
        { id: 6, name: '', text: 'Tane Laboratory', hotkey: null }
      ]
    } as widget.StashSearchWidget,
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
    } as widget.ImageStripWidget
  ]
})
