import { Rectangle, screen, app, Display } from 'electron'
import { windowManager } from './window-manager'
import { EventEmitter } from 'events'
import { logger } from './logger'

const POE_TITLE = 'Path of Exile'
let USER_DISPLAYS: Display[]

app.on('ready', () => {
  USER_DISPLAYS = screen.getAllDisplays()
})

class PoeWindowClass extends EventEmitter {
  private _isActive: boolean = false
  bounds: Rectangle | undefined
  pid: number | undefined
  isFullscreen: boolean | undefined

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
      this.emit('active-change', active, this.isActive)
      this._isActive = active
    }
  }

  startPolling () {
    setInterval(async () => {
      try {
        const title = await windowManager.getActiveWindowTitle()
        this.isActive = (title === POE_TITLE)
      } catch (e) {
        this.isActive = false
      }

      if (this.isActive) {
        try {
          this.bounds = (await windowManager.getActiveWindowContentBounds())!
          this.pid = (await windowManager.getActiveWindowId())!
          this.isFullscreen = USER_DISPLAYS.some(d =>
            d.bounds.x === this.bounds!.x &&
            d.bounds.y === this.bounds!.y &&
            d.bounds.width === this.bounds!.width &&
            d.bounds.height === this.bounds!.height
          )
        } catch (e) {
          this.isActive = false
          this.bounds = undefined
          this.pid = undefined
        }
      }
    }, 500)
  }
}

export const PoeWindow = new PoeWindowClass()
