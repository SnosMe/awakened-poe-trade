import { app, type BrowserWindow, type Point, type Rectangle } from 'electron'
import { EventEmitter } from 'node:events'
import { mkdir, rm, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import * as dbusNative from '@homebridge/dbus-native'
import { uIOhook, UiohookKey } from 'uiohook-napi'

export const isPlasmaWayland = process.platform === 'linux' &&
  process.env.XDG_SESSION_TYPE === 'wayland' &&
  (process.env.XDG_CURRENT_DESKTOP ?? '').toLowerCase().includes('kde')

export const WAYLAND_APP_ID = 'awakened-poe-trade'
export const WAYLAND_WINDOW_TITLE = 'Awakened PoE Trade'

let writeLog = (_message: string) => {}

export function setWaylandLog (write: (message: string) => void) { writeLog = write }

type DBusError = { name?: string, message?: string }
type DBusCall = [
  destination: string, path: string, interfaceName: string, member: string,
  signature?: string, body?: unknown[]
]
type SessionBus = dbusNative.MessageBus & {
  name?: string
  signals: EventEmitter
  mangle: (path: string, iface: string, member: string) => string
  addMatch: (rule: string, cb: (error?: DBusError) => void) => void
  exportInterface: (obj: object, path: string, iface: object) => void
}

let sessionBus: Promise<SessionBus> | undefined
let portalRequestId = 0

function getSessionBus () {
  sessionBus ??= (async () => {
    const bus = (dbusNative as typeof dbusNative & { sessionBus: () => SessionBus }).sessionBus()
    bus.connection.on('error', () => {})

    for (let tries = 0; !bus.name && tries < 500; ++tries) await delay(10)
    if (!bus.name) throw new Error('Timed out connecting to the session bus')
    await invoke(bus, 'org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop',
      'org.freedesktop.host.portal.Registry', 'Register', 'sa{sv}', [WAYLAND_APP_ID, []]
    ).catch(() => {})
    await Promise.all([
      addMatch(bus, "type='signal',interface='org.freedesktop.portal.Request',member='Response'"),
      addMatch(bus, "type='signal',interface='org.freedesktop.portal.GlobalShortcuts'")
    ])
    return bus
  })()
  return sessionBus
}

function invoke (bus: SessionBus, ...call: DBusCall): Promise<unknown[]> {
  const [destination, path, interfaceName, member, signature, body] = call
  return new Promise((resolve, reject) => {
    bus.invoke({ destination, path, interface: interfaceName, member, signature, body }, ((error: DBusError | undefined, ...body: unknown[]) => {
      if (error) reject(new Error(`${error.name ?? 'D-Bus error'}: ${error.message ?? ''}`))
      else resolve(body)
    }) as never)
  })
}

function addMatch (bus: SessionBus, rule: string) {
  return new Promise<void>((resolve, reject) => {
    bus.addMatch(rule, (error) => {
      if (error) reject(new Error(`${error.name ?? 'D-Bus error'}: ${error.message ?? ''}`))
      else resolve()
    })
  })
}

async function portalRequest (
  bus: SessionBus, iface: 'RemoteDesktop' | 'GlobalShortcuts', member: string,
  signature: string, body: unknown[], extraOptions: unknown[] = []
): Promise<unknown[]> {
  const token = `awakened_poe_trade_${process.pid}_${++portalRequestId}`
  const sender = bus.name!.slice(1).replaceAll('.', '_')
  const requestPath = `/org/freedesktop/portal/desktop/request/${sender}/${token}`
  const signal = bus.mangle(requestPath, 'org.freedesktop.portal.Request', 'Response')
  const response = new Promise<unknown[]>(resolve => { bus.signals.once(signal, resolve) })
  const options = [['handle_token', ['s', token]], ...extraOptions]

  await invoke(bus, 'org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop',
    `org.freedesktop.portal.${iface}`, member, signature, [...body, options])

  const [result, values] = await response
  if (result !== 0) throw new Error(`${member} rejected with response ${result as number}`)
  return values as unknown[]
}

type KWinState = {
  target: null | { id: string, active: boolean, bounds: Rectangle }
  overlay: null | { id: string, active: boolean }
}

export class WaylandWindowTracker {
  bounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
  cursorPosition: Point = { x: 0, y: 0 }

  private readonly pluginName = 'awakened-poe-trade-wayland'
  private readonly scriptPath = path.join(app.getPath('temp'), `${this.pluginName}-${process.pid}.js`)
  private readonly effectName = 'awakened-poe-trade-overlay'
  private readonly effectPath = path.join(
    process.env.XDG_DATA_HOME ?? path.join(app.getPath('home'), '.local', 'share'),
    'kwin', 'effects', this.effectName
  )
  private bus?: SessionBus
  private window?: BrowserWindow
  private targetId?: string
  private overlayId?: string
  private isAttached = false
  private isShown = false
  private restoreFocus: 'none' | 'pending' | 'requested' = 'none'
  private hideTimer?: NodeJS.Timeout
  private showTimes: number[] = []
  private suspended = false

  constructor (
    private onAttach: () => void, private onActiveChange: (active: boolean) => void,
    private onPointerMove: (position: Point, modifiers: number) => void
  ) {}

  async start (window: BrowserWindow | undefined, targetTitle: string) {
    if (!window) return
    this.window = window

    try {
      this.bus = await getSessionBus()
      this.bus.exportInterface({
        Update: (state: string) => this.update(JSON.parse(state) as KWinState),
        Pointer: (x: number, y: number, modifiers: number) => {
          this.cursorPosition = { x, y }
          this.onPointerMove(this.cursorPosition, modifiers)
        }
      }, '/org/awakened_poe_trade/Wayland', {
        name: 'org.awakened_poe_trade.Wayland',
        methods: { Update: ['s', 'b'], Pointer: ['iiu', ''] },
        properties: {}, signals: {}
      })

      await this.loadEffect().catch(error => {
        writeLog(`error [Wayland] Overlay elevation failed: ${String(error)}`)
      })

      await invoke(this.bus, 'org.kde.KWin', '/Scripting',
        'org.kde.kwin.Scripting', 'unloadScript', 's', [this.pluginName])

      await writeFile(this.scriptPath, kwinScript(
        this.bus.name!, targetTitle, process.pid, this.effectName, WAYLAND_WINDOW_TITLE))
      const [scriptId] = await invoke(this.bus, 'org.kde.KWin', '/Scripting',
        'org.kde.kwin.Scripting', 'loadScript', 'ss', [this.scriptPath, this.pluginName])
      await invoke(this.bus, 'org.kde.KWin', `/Scripting/Script${scriptId as number}`,
        'org.kde.kwin.Script', 'run')
      await unlink(this.scriptPath).catch(() => {})
    } catch (error) {
      writeLog(`error [Wayland] Window tracking failed: ${String(error)}`)
    }
  }

  activateOverlay () {
    this.window?.setIgnoreMouseEvents(false)
    this.activate(this.overlayId)
  }

  focusTarget () {
    this.window?.setIgnoreMouseEvents(true)
    this.activate(this.targetId)
  }

  async stop () {
    if (this.hideTimer) clearTimeout(this.hideTimer)
    await unlink(this.scriptPath).catch(() => {})
    if (!this.bus) return
    await Promise.all([
      invoke(this.bus, 'org.kde.KWin', '/Scripting',
        'org.kde.kwin.Scripting', 'unloadScript', 's', [this.pluginName]).catch(() => {}),
      this.unloadEffect()
    ])
  }

  private update (state: KWinState) {
    this.targetId = state.target?.id
    this.overlayId = state.overlay?.id
    if (state.target?.active || state.overlay?.active) {
      if (this.hideTimer) clearTimeout(this.hideTimer)
      this.hideTimer = undefined
    }

    if (!state.target) {
      if (this.hideTimer) clearTimeout(this.hideTimer)
      this.hideTimer = undefined
      if (this.isShown) this.window?.hide()
      this.isShown = false
      this.restoreFocus = 'none'
      this.isAttached = false
      this.onActiveChange(false)
      return false
    }

    this.bounds = state.target.bounds
    if (!this.isAttached) {
      this.isAttached = true
      this.window?.setBounds(this.bounds)
      this.window?.setIgnoreMouseEvents(true)
      this.onAttach()
    }

    if (state.target.active && !this.isShown) {
      if (this.suspended) return false
      const now = Date.now()
      this.showTimes = this.showTimes.filter(time => time > now - 1000)
      if (this.showTimes.length >= 3) {
        this.suspended = true
        writeLog('error [Wayland] Overlay remapping too quickly; window tracking suspended.')
        this.onActiveChange(false)
        return false
      }
      this.showTimes.push(now)
      this.isShown = true
      this.restoreFocus = 'pending'
      this.window?.showInactive()
      this.onActiveChange(true)
      return false
    }

    if (this.restoreFocus !== 'none') {
      if (this.restoreFocus === 'requested' && state.target.active) {
        this.restoreFocus = 'none'
      } else if (this.restoreFocus === 'pending' && state.overlay?.active) {
        this.restoreFocus = 'requested'
        this.activate(this.targetId)
        return false
      } else return false
    }

    if (!state.overlay?.active) this.window?.setIgnoreMouseEvents(true)
    if (!state.target.active && !state.overlay?.active && this.isShown && !this.hideTimer) {
      this.hideTimer = setTimeout(() => {
        this.hideTimer = undefined
        if (this.isShown) {
          this.isShown = false
          this.window?.hide()
        }
      }, 200)
    }
    this.onActiveChange(state.target.active)
    return state.target.active || Boolean(state.overlay?.active) || this.isShown
  }

  private activate (id?: string) {
    if (!id || !this.bus) return
    invoke(this.bus, 'org.kde.KWin', '/WindowsRunner',
      'org.kde.krunner1', 'Run', 'ss', [`0_${id}`, '']).catch(error => {
      writeLog(`error [Wayland] Window activation failed: ${String(error)}`)
    })
  }

  private async loadEffect () {
    if (!this.bus) return
    await invoke(this.bus, 'org.kde.KWin', '/Effects',
      'org.kde.kwin.Effects', 'unloadEffect', 's', [this.effectName]).catch(() => {})
    const codePath = path.join(this.effectPath, 'contents', 'code')
    await mkdir(codePath, { recursive: true })
    await Promise.all([
      writeFile(path.join(this.effectPath, 'metadata.json'), kwinEffectMetadata(this.effectName)),
      writeFile(path.join(codePath, 'main.js'), kwinEffect(process.pid, WAYLAND_WINDOW_TITLE))
    ])
    const [loaded] = await invoke(this.bus, 'org.kde.KWin', '/Effects',
      'org.kde.kwin.Effects', 'loadEffect', 's', [this.effectName])
    if (!loaded) throw new Error('KWin rejected the overlay effect')
  }

  private async unloadEffect () {
    if (this.bus) await invoke(this.bus, 'org.kde.KWin', '/Effects',
      'org.kde.kwin.Effects', 'unloadEffect', 's', [this.effectName]).catch(() => {})
    await rm(this.effectPath, { recursive: true, force: true }).catch(() => {})
  }
}

export class Keyboard {
  private bus?: SessionBus
  private session?: string
  private inputOperations = Promise.resolve()
  private pressedKeys = new Set<number>()

  async start () {
    if (!isPlasmaWayland) return

    try {
      this.bus = await getSessionBus()
      const created = await portalRequest(this.bus, 'RemoteDesktop', 'CreateSession', 'a{sv}', [], [
        ['session_handle_token', ['s', `awakened_poe_trade_${process.pid}`]]
      ])
      this.session = variantValue(created, 'session_handle') as string
      await portalRequest(this.bus, 'RemoteDesktop', 'SelectDevices', 'oa{sv}', [this.session], [
        ['types', ['u', 1]]
      ])
      await portalRequest(this.bus, 'RemoteDesktop', 'Start', 'osa{sv}', [this.session, ''])
    } catch (error) {
      writeLog(`error [Wayland] Keyboard access failed: ${String(error)}`)
    }
  }

  keyTap (key: number, modifiers: number[] = []) {
    if (!isPlasmaWayland) return uIOhook.keyTap(key, modifiers)
    for (const modifier of modifiers) this.keyToggle(modifier, 'down')
    this.keyToggle(key, 'down')
    this.keyToggle(key, 'up')
    for (const modifier of [...modifiers].reverse()) this.keyToggle(modifier, 'up')
  }

  keyToggle (key: number, state: 'down' | 'up') {
    if (!isPlasmaWayland) return uIOhook.keyToggle(key, state)
    if (!this.bus || !this.session) return

    const bus = this.bus
    const session = this.session
    this.inputOperations = this.inputOperations.then(async () => {
      try {
        await notifyKeyboardKeycode(bus, session, key, state)
        if (state === 'down') this.pressedKeys.add(key)
        else this.pressedKeys.delete(key)
      } catch (error) {
        writeLog(`error [Wayland] Keyboard input failed: ${String(error)}`)
      }
    })
  }

  async stop () {
    if (!this.bus || !this.session) return
    const bus = this.bus
    const session = this.session
    this.session = undefined
    this.inputOperations = this.inputOperations.then(async () => {
      for (const key of this.pressedKeys)
        await notifyKeyboardKeycode(bus, session, key, 'up').catch(() => {})
      this.pressedKeys.clear()
    })
    await this.inputOperations
    await invoke(bus, 'org.freedesktop.portal.Desktop', session,
      'org.freedesktop.portal.Session', 'Close').catch(() => {})
  }
}

function notifyKeyboardKeycode (
  bus: SessionBus, session: string, key: number, state: 'down' | 'up'
) {
  return invoke(bus, 'org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop',
    'org.freedesktop.portal.RemoteDesktop', 'NotifyKeyboardKeycode', 'oa{sv}iu',
    [session, [], toEvdev(key), state === 'down' ? 1 : 0])
}

export async function readWaylandClipboard () {
  const bus = await getSessionBus()
  const [text = ''] = await invoke(bus, 'org.kde.klipper', '/klipper',
    'org.kde.klipper.klipper', 'getClipboardContents')
  return text as string
}

export async function writeWaylandClipboard (text: string) {
  const bus = await getSessionBus()
  await invoke(bus, 'org.kde.klipper', '/klipper',
    'org.kde.klipper.klipper', 'setClipboardContents', 's', [text])
}

export type WaylandShortcut = { shortcut: string, description: string, onActivated: () => void }

export class WaylandShortcuts {
  private bus?: SessionBus
  private session?: string
  private shortcuts: Array<WaylandShortcut & { id: string }> = []
  private enabled = false
  private operations = Promise.resolve()
  private readonly activated = (body: unknown[]) => {
    const [session, id] = body as [string, string]
    if (session === this.session) this.shortcuts.find(shortcut => shortcut.id === id)?.onActivated()
  }

  configure (shortcuts: WaylandShortcut[]) {
    const next = shortcuts.map((shortcut, index) => ({
      ...shortcut,
      id: `action_${index}_${shortcut.shortcut.replaceAll(/[^A-Za-z0-9]/g, '_')}`
    }))
    this.operations = this.operations.then(async () => {
      await this.close()
      this.shortcuts = next
      if (this.enabled) await this.open()
    })
    return this.operations
  }

  start () {
    this.enabled = true
    this.operations = this.operations.then(() => this.enabled ? this.open() : undefined)
    return this.operations
  }

  stop () {
    this.enabled = false
    this.operations = this.operations.then(() => this.close())
    return this.operations
  }

  private async open () {
    if (!isPlasmaWayland || this.session || this.shortcuts.length === 0) return

    try {
      this.bus = await getSessionBus()
      const created = await portalRequest(this.bus, 'GlobalShortcuts', 'CreateSession', 'a{sv}', [], [
        ['session_handle_token', ['s', `awakened_poe_trade_shortcuts_${process.pid}_${++portalRequestId}`]]
      ])
      this.session = variantValue(created, 'session_handle') as string

      const activatedSignal = shortcutSignal(this.bus)
      this.bus.signals.on(activatedSignal, this.activated)

      const definitions = this.shortcuts.map(shortcut => [shortcut.id, [
        ['description', ['s', shortcut.description]],
        ['preferred_trigger', ['s', toPortalTrigger(shortcut.shortcut)]]
      ]])
      const listed = await portalRequest(
        this.bus, 'GlobalShortcuts', 'ListShortcuts', 'oa{sv}', [this.session]
      )
      const existing = variantValue(listed, 'shortcuts') as unknown[]
      const existingIds = new Set(existing.map(shortcut => (shortcut as unknown[])[0] as string))
      if (!this.shortcuts.every(shortcut => existingIds.has(shortcut.id))) {
        await portalRequest(this.bus, 'GlobalShortcuts', 'BindShortcuts',
          'oa(sa{sv})sa{sv}', [this.session, definitions, ''])
      }
    } catch (error) {
      writeLog(`error [Wayland] Global shortcut access failed: ${String(error)}`)
      await this.close()
    }
  }

  private async close () {
    if (!this.bus || !this.session) return
    this.bus.signals.off(shortcutSignal(this.bus), this.activated)
    await invoke(this.bus, 'org.freedesktop.portal.Desktop', this.session,
      'org.freedesktop.portal.Session', 'Close').catch(() => {})
    this.session = undefined
  }
}

function shortcutSignal (bus: SessionBus) {
  return bus.mangle('/org/freedesktop/portal/desktop',
    'org.freedesktop.portal.GlobalShortcuts', 'Activated')
}

function variantValue (values: unknown[], name: string) {
  const entry = values.find(value => Array.isArray(value) && value[0] === name) as unknown[] | undefined
  if (!entry) throw new Error(`Portal response did not contain ${name}`)
  return (entry[1] as [unknown, unknown[]])[1][0]
}

function toEvdev (key: number) {
  const extended: Record<number, number> = {
    [UiohookKey.PageUp]: 104, [UiohookKey.PageDown]: 109,
    [UiohookKey.End]: 107, [UiohookKey.Home]: 102,
    [UiohookKey.ArrowLeft]: 105, [UiohookKey.ArrowUp]: 103,
    [UiohookKey.ArrowRight]: 106, [UiohookKey.ArrowDown]: 108,
    [UiohookKey.Insert]: 110, [UiohookKey.Delete]: 111
  }
  return extended[key] ?? key
}

function toPortalTrigger (shortcut: string) {
  const modifiers: Record<string, string> = { Ctrl: 'CTRL', Alt: 'ALT', Shift: 'SHIFT', Meta: 'LOGO' }
  const keysyms: Record<string, string> = {
    Space: 'space', Enter: 'Return', Backspace: 'BackSpace', CapsLock: 'Caps_Lock',
    PageUp: 'Prior', PageDown: 'Next', ArrowLeft: 'Left', ArrowUp: 'Up',
    ArrowRight: 'Right', ArrowDown: 'Down', Numpad0: 'KP_0', Numpad1: 'KP_1',
    Numpad2: 'KP_2', Numpad3: 'KP_3', Numpad4: 'KP_4', Numpad5: 'KP_5',
    Numpad6: 'KP_6', Numpad7: 'KP_7', Numpad8: 'KP_8', Numpad9: 'KP_9',
    NumpadMultiply: 'KP_Multiply', NumpadAdd: 'KP_Add', NumpadSubtract: 'KP_Subtract',
    NumpadDecimal: 'KP_Decimal', NumpadDivide: 'KP_Divide', Semicolon: 'semicolon',
    Equal: 'equal', Comma: 'comma', Minus: 'minus', Period: 'period', Slash: 'slash',
    Backquote: 'grave', BracketLeft: 'bracketleft', Backslash: 'backslash',
    BracketRight: 'bracketright', Quote: 'apostrophe'
  }
  return shortcut.split(' + ').map(key =>
    modifiers[key] ?? keysyms[key] ?? (/^[A-Z]$/.test(key) ? key.toLowerCase() : key)
  ).join('+')
}

function kwinScript (
  busName: string, targetTitle: string, pid: number, effectName: string, overlayTitle: string
) {
  return `
const [busName, targetTitle, overlayPid, effectName, overlayTitle] = ${JSON.stringify([
    busName, targetTitle, pid, effectName, overlayTitle
  ])}
const aptPath = '/org/awakened_poe_trade/Wayland'
const aptInterface = 'org.awakened_poe_trade.Wayland'
let target
let overlay
let updateSerial = 0, pointerSentAt = 0, pointerSerial = 0, pointerDelivered = 0

function sendPointer (force = false) {
  if (!target || (!target.active && !(overlay && overlay.active))) return
  const now = Date.now()
  if (!force && now - pointerSentAt < 16) return
  pointerSentAt = now
  const position = workspace.cursorPos
  const serial = ++pointerSerial
  callDBus('org.kde.KWin', '/Effects', 'org.kde.kwin.Effects', 'debug', effectName, '', debug => {
    if (serial < pointerDelivered) return
    pointerDelivered = serial
    const match = /\\n\\s+To: (-?\\d+)/.exec(String(debug))
    callDBus(busName, aptPath, aptInterface, 'Pointer',
      position.x, position.y, match ? Number(match[1]) : 0)
  })
}

function sendState () {
  const serial = ++updateSerial
  const state = {
    target: target ? { id: target.internalId.toString(), active: target.active,
      bounds: target.frameGeometry } : null,
    overlay: overlay ? { id: overlay.internalId.toString(), active: overlay.active } : null
  }
  callDBus(busName, aptPath, aptInterface, 'Update', JSON.stringify(state), visible => {
    if (serial === updateSerial && overlay) overlay.opacity = visible ? 1 : 0.01
  })
}

function refresh () {
  const previousTarget = target
  const previousOverlay = overlay
  target = workspace.stackingOrder.find(window => {
    const appIds = [window.desktopFileName, window.resourceClass, window.resourceName]
      .map(value => String(value).toLowerCase())
    return window.caption === targetTitle &&
      appIds.some(value => value === 'steam_app_238960' || value.startsWith('pathofexile'))
  })
  overlay = workspace.stackingOrder.find(window =>
    window.pid === overlayPid && window.caption === overlayTitle)

  if (target && target !== previousTarget) {
    const tracked = target
    tracked.frameGeometryChanged.connect(() => { if (target === tracked) refresh() })
  }
  if (overlay) {
    if (overlay !== previousOverlay) overlay.opacity = 0.01
    if (target && !sameGeometry(overlay.frameGeometry, target.frameGeometry))
      overlay.frameGeometry = target.frameGeometry
    if (!overlay.keepAbove) overlay.keepAbove = true
    if (!overlay.skipTaskbar) overlay.skipTaskbar = true
    if (!overlay.skipSwitcher) overlay.skipSwitcher = true
  }
  sendState()
  sendPointer(true)
}

function watchCaption (window) { window.captionChanged.connect(refresh) }
function remove (window) {
  if (window === target) target = undefined
  if (window === overlay) overlay = undefined
  sendState()
}
function sameGeometry (a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

workspace.stackingOrder.forEach(watchCaption)
workspace.windowAdded.connect(window => { watchCaption(window); refresh() })
workspace.windowRemoved.connect(remove)
workspace.windowActivated.connect(refresh)
workspace.cursorPosChanged.connect(() => sendPointer())
refresh()
`
}

function kwinEffectMetadata (id: string) {
  return `${JSON.stringify({
    KPackageStructure: 'KWin/Effect',
    KPlugin: {
      EnabledByDefault: false, Id: id, License: 'MIT',
      Name: 'Awakened PoE Trade Overlay'
    },
    'X-Plasma-API': 'javascript'
  }, null, 2)}\n`
}

function kwinEffect (pid: number, overlayTitle: string) {
  return `
const [overlayPid, overlayTitle] = ${JSON.stringify([pid, overlayTitle])}
const controlModifier = 0x04000000, altModifier = 0x08000000
let overlay, modifierAnimation, modifiers = 0

function updateModifierAnimation () {
  if (modifierAnimation) cancel(modifierAnimation)
  modifierAnimation = undefined
  if (overlay && modifiers)
    modifierAnimation = set({ window: overlay, duration: 1,
      animations: [{ type: Effect.Generic, to: modifiers }] })
}

function refresh () {
  const next = effects.stackingOrder.find(window =>
    window.pid === overlayPid && window.caption === overlayTitle)
  if (next === overlay) return
  if (overlay) effects.setElevatedWindow(overlay, false)
  overlay = next
  if (overlay) effects.setElevatedWindow(overlay, true)
  updateModifierAnimation()
}

effects.windowAdded.connect(refresh)
effects.windowClosed.connect(window => {
  if (window !== overlay) return
  if (modifierAnimation) cancel(modifierAnimation)
  modifierAnimation = undefined
  effects.setElevatedWindow(overlay, false)
  overlay = undefined
})
effects.mouseChanged.connect((position, oldPosition, buttons, oldButtons, nextModifiers) => {
  const nativeModifiers = Number(nextModifiers)
  const modifiersNow = (nativeModifiers & controlModifier ? 1 : 0) |
    (nativeModifiers & altModifier ? 2 : 0)
  if (modifiers === modifiersNow) return
  modifiers = modifiersNow
  updateModifierAnimation()
})
refresh()
`
}
