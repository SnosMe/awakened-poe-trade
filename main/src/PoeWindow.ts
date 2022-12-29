import type { BrowserWindow } from 'electron'
import { EventEmitter } from 'events'
import { logger } from './logger'
import { config } from './config'
import { OverlayController, AttachEvent } from 'electron-overlay-window'

interface PoeWindowClass {
  on: (event: 'active-change', listener: (isActive: boolean) => void) => this
}
class PoeWindowClass extends EventEmitter {
  private _isActive: boolean = false

  get bounds () { return OverlayController.targetBounds }

  get isActive () { return this._isActive }

  set isActive (active: boolean) {
    if (this.isActive !== active) {
      if (active) {
        logger.verbose('Is active', { source: 'poe-window' })
      } else {
        logger.verbose('Not focused', { source: 'poe-window' })
      }
      this._isActive = active
      this.emit('active-change', this._isActive)
    }
  }

  get uiSidebarWidth () {
    // sidebar is 370px at 800x600
    const ratio = 370 / 600
    return Math.round(this.bounds.height * ratio)
  }

  attach (window: BrowserWindow) {
    OverlayController.events.on('focus', () => { this.isActive = true })
    OverlayController.events.on('blur', () => { this.isActive = false })

    OverlayController.attachByTitle(window, config.get('windowTitle'))
  }

  onAttach (cb: (hasAccess: boolean | undefined) => void) {
    OverlayController.events.on('attach', (e: AttachEvent) => {
      cb(e.hasAccess)
    })
  }
}

export const PoeWindow = new PoeWindowClass()
