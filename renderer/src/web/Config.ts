import { reactive as deepReactive, shallowRef, toRaw } from 'vue'
import isDeepEqual from 'fast-deep-equal'
import { Host } from '@/web/background/IPC'
import { HostConfig, ShortcutAction } from '@ipc/types'
import type * as widget from './overlay/widgets'
import type { StashSearchWidget } from './stash-search/widget'
import type { ItemCheckWidget } from './item-check/widget'
import type { ItemSearchWidget } from './item-search/widget'

const _config = shallowRef<Config | null>(null)
let _lastSavedConfig: Config | null = null

export function AppConfig (): Config
export function AppConfig<T extends widget.Widget> (type: string): T | undefined
export function AppConfig (type?: string) {
  if (!type) {
    return _config.value!
  } else {
    return _config.value!.widgets.find(w => w.wmType === type)
  }
}

export function updateConfig (updates: Config) {
  _config.value = deepReactive(JSON.parse(JSON.stringify(updates)))
  document.documentElement.style.fontSize = `${_config.value!.fontSize}px`
}

export function saveConfig (opts?: { isTemporary: boolean }) {
  const rawConfig = toRaw(_config.value!)
  if (rawConfig.widgets.some(w => w.wmZorder === 'exclusive' && w.wmWants === 'show')) {
    return
  }

  if (!isDeepEqual(rawConfig, _lastSavedConfig)) {
    _lastSavedConfig = JSON.parse(JSON.stringify(rawConfig))
    Host.sendEvent({
      name: 'CLIENT->MAIN::save-config',
      payload: {
        contents: JSON.stringify(AppConfig()),
        isTemporary: opts?.isTemporary ?? false
      }
    })
  }
}

export function pushHostConfig () {
  Host.sendEvent({
    name: 'CLIENT->MAIN::update-host-config',
    payload: getConfigForHost()
  })
}

export async function initConfig () {
  Host.onEvent('MAIN->CLIENT::config-changed', (e) => {
    _lastSavedConfig = JSON.parse(e.contents) // should be a deep copy
    updateConfig(JSON.parse(e.contents))
  })

  const contents = await Host.getConfig()
  if (!contents) {
    updateConfig(defaultConfig())
    return
  }

  let config: Config
  try {
    config = JSON.parse(contents)
  } catch {
    updateConfig(defaultConfig())
    saveConfig({ isTemporary: true })
    return

    // TODO
    // dialog.showErrorBox(
    //   'Awakened PoE Trade - Incompatible configuration',
    //   // ----------------------
    //   'You are trying to use an older version of Awakened PoE Trade with a newer incompatible configuration file.\n' +
    //   'You need to install the latest version to continue using it.'
    // )
  }

  updateConfig(upgradeConfig(config))
}

export function poeWebApi () {
  const { language, realm } = AppConfig()
  switch (language) {
    case 'en': return 'www.pathofexile.com'
    case 'ru': return 'ru.pathofexile.com'
    case 'cmn-Hant': return (realm === 'pc-garena')
      ? 'pathofexile.tw'
      : 'www.pathofexile.com'
    case 'ko': return 'poe.game.daum.net'
  }
}

export interface Config {
  configVersion: number
  leagueId?: string
  overlayKey: string
  overlayBackground: string
  overlayBackgroundClose: boolean
  restoreClipboard: boolean
  commands: Array<{
    text: string
    hotkey: string | null
    send: boolean
  }>
  clientLog: string | null
  gameConfig: string | null
  windowTitle: string
  logKeys: boolean
  accountName: string
  stashScroll: boolean
  language: 'en' | 'ru' | 'cmn-Hant' | 'ko'
  realm: 'pc-ggg' | 'pc-garena'
  widgets: widget.Widget[]
  fontSize: number
  showAttachNotification: boolean
}

export const defaultConfig = (): Config => ({
  configVersion: 16,
  overlayKey: 'Shift + Space',
  overlayBackground: 'rgba(129, 139, 149, 0.15)',
  overlayBackgroundClose: true,
  restoreClipboard: false,
  showAttachNotification: true,
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
  logKeys: false,
  accountName: '',
  stashScroll: true,
  language: 'en',
  realm: 'pc-ggg',
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
      showRateLimitState: false,
      apiLatencySeconds: 2,
      collapseListings: 'api',
      smartInitialSearch: true,
      lockedInitialSearch: true,
      activateStockFilter: false,
      builtinBrowser: false,
      hotkey: 'D',
      hotkeyHold: 'Ctrl',
      hotkeyLocked: 'Ctrl + Alt + D',
      showSeller: false,
      searchStatRange: 10,
      showCursor: true,
      requestPricePrediction: false,
      rememberCurrency: false
    } as widget.PriceCheckWidget,
    {
      wmId: 3,
      wmType: 'item-check',
      wmTitle: '',
      wmWants: 'hide',
      wmZorder: 'exclusive',
      wmFlags: ['hide-on-blur', 'skip-menu'],
      hotkey: null,
      wikiKey: null,
      poedbKey: null,
      craftOfExileKey: null,
      stashSearchKey: null,
      maps: {
        profile: 1,
        showNewStats: false,
        selectedStats: [
          {
            matcher: '#% maximum Player Resistances',
            decision: 'w--'
          },
          {
            matcher: 'Monsters reflect #% of Physical Damage',
            decision: 'd--'
          },
          {
            matcher: 'Monsters reflect #% of Elemental Damage',
            decision: 'd--'
          },
          {
            matcher: 'Area contains two Unique Bosses',
            decision: 'g--'
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
      wmFlags: ['hide-on-focus', 'skip-menu'],
      toggleKey: null
    } as widget.DelveGridWidget,
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
    } as ItemSearchWidget,
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
    } as StashSearchWidget,
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
    } as StashSearchWidget,
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

function upgradeConfig (_config: Config): Config {
  const config = _config as Omit<Config, 'widgets'> & { widgets: Array<Record<string, any>> }

  if (config.configVersion < 3) {
    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'image-strip')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1,
      wmZorder: null
    })

    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'delve-grid')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1,
      wmZorder: null
    })

    config.widgets.find(w => w.wmType === 'menu')!
      .alwaysShow = false

    config.configVersion = 3
  }

  if (config.configVersion < 4) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .chaosPriceThreshold = 0.05

    const mapCheck = config.widgets.find(w => w.wmType === 'map-check')!
    ;(mapCheck as any).selectedStats.forEach((e: any) => {
      e.matcher = e.matchRef
      e.matchRef = undefined
    })

    {
      const widgets = config.widgets.filter(w => w.wmType === 'image-strip')!
      widgets.forEach((imgStrip: any) => {
        imgStrip.images.forEach((e: any, idx: number) => {
          e.id = idx
        })
      })
    }

    config.configVersion = 4
  }

  if (config.configVersion < 5) {
    config.commands.forEach(cmd => {
      cmd.send = true
    })

    config.configVersion = 5
  }

  if (config.configVersion < 6) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .showRateLimitState = ((config as any).logLevel === 'debug')
    config.widgets.find(w => w.wmType === 'price-check')!
      .apiLatencySeconds = 2

    config.configVersion = 6
  }

  if (config.configVersion < 7) {
    const mapCheck = config.widgets.find(w => w.wmType === 'map-check')!
    mapCheck.wmType = 'item-check'
    mapCheck.maps = { selectedStats: mapCheck.selectedStats }
    mapCheck.selectedStats = undefined

    ;(config as any).itemCheckKey = (config as any).mapCheckKey || null
    ;(config as any).mapCheckKey = undefined

    config.configVersion = 7
  }

  if (config.configVersion < 8) {
    const itemCheck = config.widgets.find(w => w.wmType === 'item-check')!
    ;(itemCheck as ItemCheckWidget).maps.showNewStats = false
    itemCheck.maps.selectedStats = (itemCheck as ItemCheckWidget).maps.selectedStats.map(entry => ({
      matcher: entry.matcher,
      decision:
        (entry as any).valueDanger ? 'danger'
          : (entry as any).valueWarning ? 'warning'
              : (entry as any).valueDesirable ? 'desirable'
                  : 'seen'
    }))

    config.configVersion = 8
  }

  if (config.configVersion < 9) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .collapseListings = 'api'

    config.widgets.find(w => w.wmType === 'price-check')!
      .smartInitialSearch = true
    config.widgets.find(w => w.wmType === 'price-check')!
      .lockedInitialSearch = true

    config.widgets.find(w => w.wmType === 'price-check')!
      .activateStockFilter = false

    config.configVersion = 9
  }

  if (config.configVersion < 10) {
    config.widgets.push({
      ...defaultConfig().widgets.find(w => w.wmType === 'settings')!,
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1
    })

    const priceCheck = config.widgets.find(w => w.wmType === 'price-check')!
    priceCheck.hotkey = (config as any).priceCheckKey
    priceCheck.hotkeyHold = (config as any).priceCheckKeyHold
    priceCheck.hotkeyLocked = (config as any).priceCheckLocked
    priceCheck.showSeller = (config as any).showSeller
    priceCheck.searchStatRange = (config as any).searchStatRange
    priceCheck.showCursor = (config as any).priceCheckShowCursor

    if (priceCheck.chaosPriceThreshold === 0.05) {
      priceCheck.chaosPriceThreshold = 0
    }

    config.configVersion = 10
  }

  if (config.configVersion < 11) {
    config.widgets.find(w => w.wmType === 'price-check')!
      .requestPricePrediction = false

    config.configVersion = 11
  }

  if (config.configVersion < 12) {
    const afterSettings = config.widgets.findIndex(w => w.wmType === 'settings')
    config.widgets.splice(afterSettings + 1, 0, {
      ...defaultConfig().widgets.find(w => w.wmType === 'item-search')!,
      wmWants: 'show',
      wmId: Math.max(0, ...config.widgets.map(_ => _.wmId)) + 1
    })

    config.realm = 'pc-ggg'
    if (config.language === 'zh_TW' as string) {
      config.language = 'cmn-Hant'
    }

    config.configVersion = 12
  }

  if (config.configVersion < 13) {
    config.showAttachNotification = true

    config.configVersion = 13
  }

  if (config.configVersion < 14) {
    const imgWidgets = config.widgets.filter(w => w.wmType === 'image-strip') as widget.ImageStripWidget[]
    imgWidgets.forEach((imgStrip) => {
      imgStrip.images.forEach((e) => {
        e.url = e.url.startsWith('app-file://')
          ? e.url.slice('app-file://'.length)
          : e.url
      })
    })

    const itemCheck = config.widgets.find(w => w.wmType === 'item-check') as ItemCheckWidget
    itemCheck.wikiKey = (config as any).wikiKey
    itemCheck.poedbKey = null
    itemCheck.craftOfExileKey = (config as any).craftOfExileKey
    itemCheck.stashSearchKey = null

    config.configVersion = 14
  }

  if (config.configVersion < 15) {
    const priceCheck = config.widgets.find(w => w.wmType === 'price-check') as widget.PriceCheckWidget
    priceCheck.builtinBrowser = false

    const itemSearch = config.widgets.find(w => w.wmType === 'item-search') as ItemSearchWidget
    itemSearch.ocrGemsKey = null

    const itemCheck = config.widgets.find(w => w.wmType === 'item-check') as ItemCheckWidget
    itemCheck.maps.profile = 1
    for (const stat of itemCheck.maps.selectedStats) {
      const p1decision =
        (stat.decision === 'danger') ? 'd'
          : (stat.decision === 'warning') ? 'w'
              : (stat.decision === 'desirable') ? 'g' : 's'

      stat.decision = `${p1decision}--`
    }

    config.configVersion = 15
  }

  if (config.configVersion < 16) {
    const delve = config.widgets.find(w => w.wmType === 'delve-grid') as widget.DelveGridWidget
    delve.toggleKey = (config as any).delveGridKey

    const itemCheck = config.widgets.find(w => w.wmType === 'item-check') as ItemCheckWidget
    itemCheck.hotkey = (config as any).itemCheckKey

    if (itemCheck.maps.profile === undefined) {
      itemCheck.maps.profile = 1
      itemCheck.maps.selectedStats = []
    }

    config.configVersion = 16
  }

  if (config.logKeys === undefined) {
    config.logKeys = false
  }

  const priceCheck = config.widgets.find(w => w.wmType === 'price-check') as widget.PriceCheckWidget
  if (priceCheck.rememberCurrency === undefined) {
    priceCheck.rememberCurrency = false
  }

  for (const widget of config.widgets) {
    if (widget.wmType === 'stash-search') {
      (widget as StashSearchWidget).enableHotkeys ??= true
    }
  }

  return config as unknown as Config
}

function getConfigForHost (): HostConfig {
  const actions: ShortcutAction[] = []

  const config = AppConfig()
  const priceCheck = AppConfig('price-check') as widget.PriceCheckWidget
  if (priceCheck.hotkey) {
    actions.push({
      shortcut: `${priceCheck.hotkeyHold} + ${priceCheck.hotkey}`,
      action: { type: 'copy-item', target: 'price-check', focusOverlay: false },
      keepModKeys: true
    })
  }
  if (priceCheck.hotkeyLocked) {
    actions.push({
      shortcut: priceCheck.hotkeyLocked,
      action: { type: 'copy-item', target: 'price-check', focusOverlay: true }
    })
  }
  actions.push({
    shortcut: config.overlayKey,
    action: { type: 'toggle-overlay' },
    keepModKeys: true
  })
  const itemCheck = AppConfig('item-check') as ItemCheckWidget
  if (itemCheck.wikiKey) {
    actions.push({
      shortcut: itemCheck.wikiKey,
      action: { type: 'copy-item', target: 'open-wiki' }
    })
  }
  if (itemCheck.craftOfExileKey) {
    actions.push({
      shortcut: itemCheck.craftOfExileKey,
      action: { type: 'copy-item', target: 'open-craft-of-exile' }
    })
  }
  if (itemCheck.poedbKey) {
    actions.push({
      shortcut: itemCheck.poedbKey,
      action: { type: 'copy-item', target: 'open-poedb' }
    })
  }
  if (itemCheck.stashSearchKey) {
    actions.push({
      shortcut: itemCheck.stashSearchKey,
      action: { type: 'copy-item', target: 'search-similar' }
    })
  }
  if (itemCheck.hotkey) {
    actions.push({
      shortcut: itemCheck.hotkey,
      action: { type: 'copy-item', target: 'item-check', focusOverlay: true }
    })
  }
  const delveGrid = AppConfig('delve-grid') as widget.DelveGridWidget
  if (delveGrid.toggleKey) {
    actions.push({
      shortcut: delveGrid.toggleKey,
      action: { type: 'trigger-event', target: 'delve-grid' },
      keepModKeys: true
    })
  }
  for (const command of config.commands) {
    if (command.hotkey) {
      actions.push({
        shortcut: command.hotkey,
        action: { type: 'paste-in-chat', text: command.text, send: command.send }
      })
    }
  }
  for (const widget of config.widgets) {
    if (widget.wmType === 'stash-search') {
      const stashSearch = widget as StashSearchWidget
      if (!stashSearch.enableHotkeys) continue

      for (const entry of stashSearch.entries) {
        if (entry.hotkey) {
          actions.push({
            shortcut: entry.hotkey,
            action: { type: 'stash-search', text: entry.text }
          })
        }
      }
    } else if (widget.wmType === 'timer') {
      const stopwatch = widget as widget.StopwatchWidget
      if (stopwatch.toggleKey) {
        actions.push({
          shortcut: stopwatch.toggleKey,
          keepModKeys: true,
          action: {
            type: 'trigger-event',
            target: `stopwatch-start-stop:${widget.wmId}`
          }
        })
      }
      if (stopwatch.resetKey) {
        actions.push({
          shortcut: stopwatch.resetKey,
          keepModKeys: true,
          action: {
            type: 'trigger-event',
            target: `stopwatch-reset:${widget.wmId}`
          }
        })
      }
    } else if (widget.wmType === 'item-search') {
      const itemSearch = widget as ItemSearchWidget
      if (itemSearch.ocrGemsKey) {
        actions.push({
          shortcut: itemSearch.ocrGemsKey,
          keepModKeys: true,
          action: { type: 'ocr-text', target: 'heist-gems' }
        })
      }
    }
  }

  return {
    shortcuts: actions,
    restoreClipboard: config.restoreClipboard,
    clientLog: config.clientLog,
    gameConfig: config.gameConfig,
    stashScroll: config.stashScroll,
    overlayKey: config.overlayKey,
    logKeys: config.logKeys,
    windowTitle: config.windowTitle,
    language: config.language
  }
}
