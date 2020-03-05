import { Rectangle } from 'electron'
import { windowManager } from './window-manager'
import { EventEmitter } from 'events'

const POE_TITLE = 'Path of Exile'

class PoeWindowClass extends EventEmitter {
  private _isActive: boolean = false
  bounds: Rectangle | undefined
  pid: number | undefined

  get isActive () {
    return this._isActive
  }

  set isActive (active: boolean) {
    if (this.isActive !== active) {
      this.emit('active-change', active, this.isActive)
    }
    this._isActive = active
  }

  startPolling () {
    setInterval(async () => {
      const title = await windowManager.getActiveWindowTitle()
      this.isActive = (title === POE_TITLE)
      if (this.isActive) {
        this.bounds = (await windowManager.getActiveWindowContentBounds())!
        this.pid = (await windowManager.getActiveWindowId())!
      }
    }, 1000)
  }
}

export const PoeWindow = new PoeWindowClass()
