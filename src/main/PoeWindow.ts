import { Rectangle } from 'electron'
import { windowManager } from './window-manager'
import { EventEmitter } from 'events'
import { logger } from './logger'
import { config } from './config'

interface PoeWindowClass {
  on(event: 'active-change', listener: (isActive: boolean) => void): this
}
class PoeWindowClass extends EventEmitter {
  private _isActive: boolean = false
  bounds: Rectangle | undefined
  pid: number | undefined

  get isActive () {
    return this._isActive
  }

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

  startPolling () {
    setInterval(async () => {
      let isActive = false

      try {
        const title = await windowManager.getActiveWindowTitle()
        isActive = (title === config.get('windowTitle'))
      } catch (e) {}

      if (isActive) {
        try {
          this.bounds = (await windowManager.getActiveWindowContentBounds())!
          this.pid = (await windowManager.getActiveWindowId())!
        } catch (e) {
          isActive = false
          this.bounds = undefined
          this.pid = undefined
        }
      }

      this.isActive = isActive
    }, 500)
  }
}

export const PoeWindow = new PoeWindowClass()
