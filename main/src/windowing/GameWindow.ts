import { screen, type BrowserWindow } from 'electron'
import { EventEmitter } from 'events'
import { OverlayController, AttachEvent } from 'electron-overlay-window'
import { isPlasmaWayland, WaylandWindowTracker } from '../wayland'

export interface GameWindow {
  on: (event: 'active-change', listener: (isActive: boolean) => void) => this
}
export class GameWindow extends EventEmitter {
  private _isActive = false
  private _isTracking = false
  private _keyboardModifiers = 0
  private wayland?: WaylandWindowTracker

  get bounds () { return this.wayland?.bounds ?? OverlayController.targetBounds }

  get cursorPosition () { return this.wayland?.cursorPosition ?? screen.getCursorScreenPoint() }

  get keyboardModifiers () { return this._keyboardModifiers }

  get isActive () { return this._isActive }

  set isActive (active: boolean) {
    if (this.isActive !== active) {
      this._isActive = active
      this.emit('active-change', this._isActive)
    }
  }

  get uiSidebarWidth () {
    // sidebar is 370px at 800x600
    const ratio = 370 / 600
    return Math.round(this.bounds.height * ratio)
  }

  constructor () {
    super()
  }

  attach (window: BrowserWindow | undefined, title: string) {
    if (!this._isTracking) {
      this._isTracking = true
      if (isPlasmaWayland) {
        this.wayland = new WaylandWindowTracker(
          () => { this.emit('attach', undefined) },
          (active) => { this.isActive = active },
          (position, modifiers) => {
            this._keyboardModifiers = modifiers
            this.emit('pointer-move', position, modifiers)
          }
        )
        this.wayland.start(window, title)
        return
      }
      OverlayController.events.on('focus', () => { this.isActive = true })
      OverlayController.events.on('blur', () => { this.isActive = false })
      OverlayController.attachByTitle(window, title, { hasTitleBarOnMac: true })
    }
  }

  onAttach (cb: (hasAccess: boolean | undefined) => void) {
    if (isPlasmaWayland) return void this.addListener('attach', cb)
    OverlayController.events.on('attach', (e: AttachEvent) => {
      cb(e.hasAccess)
    })
  }

  activateOverlay () {
    if (this.wayland) this.wayland.activateOverlay()
    else OverlayController.activateOverlay()
  }

  focusTarget () {
    if (this.wayland) this.wayland.focusTarget()
    else OverlayController.focusTarget()
  }

  stop () {
    return this.wayland?.stop() ?? Promise.resolve()
  }

  screenshot () {
    return OverlayController.screenshot()
  }
}
