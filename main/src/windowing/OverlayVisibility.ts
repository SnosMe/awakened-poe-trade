import { uIOhook, UiohookKey } from 'uiohook-napi'
import type { ServerEvents } from '../server'
import type { GameConfig } from '../host-files/GameConfig'
import type { OverlayWindow } from './OverlayWindow'

export class OverlayVisibility {
  private timerId: NodeJS.Timeout | undefined
  private isOverlayVisible = true

  constructor (
    private server: ServerEvents,
    private overlay: OverlayWindow,
    private gameConfig: GameConfig
  ) {
    uIOhook.on('keydown', (e) => {
      if (e.altKey && !e.shiftKey && !e.ctrlKey && e.keycode === UiohookKey.Alt) {
        this.makeInvisible()
      } else {
        this.makeVisible()
      }
    })

    uIOhook.on('keyup', (e) => {
      if (!e.altKey) { this.makeVisible() }
    })

    uIOhook.on('mousemove', (e) => {
      if (!e.altKey) { this.makeVisible() }
    })
  }

  private makeVisible () {
    if (this.isOverlayVisible && this.timerId === undefined) return

    if (this.timerId !== undefined) {
      clearTimeout(this.timerId)
      this.timerId = undefined
    } else {
      this.isOverlayVisible = true
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->OVERLAY::visibility',
        payload: { isVisible: this.isOverlayVisible }
      })
    }
  }

  private makeInvisible () {
    if (!this.isOverlayVisible || this.timerId !== undefined) return

    this.timerId = setTimeout(() => {
      this.timerId = undefined
      this.isOverlayVisible = false
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->OVERLAY::visibility',
        payload: { isVisible: this.isOverlayVisible }
      })
    }, this.overlay.isInteractable ? 85 : 275)
  }
}
