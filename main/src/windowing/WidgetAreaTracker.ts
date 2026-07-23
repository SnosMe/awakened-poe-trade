import { Rectangle, Point, screen } from 'electron'
import { uIOhook, UiohookMouseEvent } from 'uiohook-napi'
import type { OverlayWindow } from './OverlayWindow'
import type { GameWindow } from './GameWindow'
import type { ServerEvents } from '../server'
import { isPlasmaWayland } from '../wayland'

export class WidgetAreaTracker {
  private holdKey!: string
  private from!: Point
  private area!: Rectangle
  private closeThreshold!: number

  constructor (
    private server: ServerEvents,
    private overlay: OverlayWindow,
    private poeWindow: GameWindow
  ) {
    this.server.onEventAnyClient('OVERLAY->MAIN::track-area', (opts) => {
      this.holdKey = opts.holdKey
      if (process.platform === 'win32') {
        this.closeThreshold = opts.closeThreshold * opts.dpr
        this.from = screen.dipToScreenPoint(opts.from)
        // NOTE: bug in electron accepting only integers
        this.area = screen.dipToScreenRect(null, {
          x: Math.round(opts.area.x),
          y: Math.round(opts.area.y),
          width: Math.round(opts.area.width),
          height: Math.round(opts.area.height)
        })
      } else {
        this.closeThreshold = opts.closeThreshold
        this.from = opts.from
        this.area = isPlasmaWayland ? {
          ...opts.area,
          x: opts.area.x + this.poeWindow.bounds.x,
          y: opts.area.y + this.poeWindow.bounds.y
        } : opts.area
      }

      this.removeListeners()
      if (isPlasmaWayland) {
        this.poeWindow.addListener('pointer-move', this.handleWaylandMouseMove)
        this.handleWaylandMouseMove(this.poeWindow.cursorPosition, this.poeWindow.keyboardModifiers)
        return
      }
      uIOhook.addListener('mousemove', this.handleMouseMove)
      uIOhook.addListener('mousedown', this.handleMouseDown)
    })
  }

  removeListeners () {
    this.poeWindow.removeListener('pointer-move', this.handleWaylandMouseMove)
    uIOhook.removeListener('mousemove', this.handleMouseMove)
    uIOhook.removeListener('mousedown', this.handleMouseDown)
  }

  private readonly handleMouseMove = (e: UiohookMouseEvent) => {
    const modifier = e.ctrlKey ? 'Ctrl' : (e.altKey ? 'Alt' : undefined)
    this.handlePointerMove(e, modifier === this.holdKey)
  }

  private readonly handleWaylandMouseMove = (position: Point, modifiers: number) => {
    if (!isPlasmaWayland) return
    const holdModifier = this.holdKey === 'Ctrl' ? 1 : (this.holdKey === 'Alt' ? 2 : 0)
    this.handlePointerMove(position, (modifiers & holdModifier) !== 0)
  }

  private handlePointerMove (position: Point, holdKeyActive: boolean) {
    if (!this.overlay.isInteractable && !holdKeyActive) {
      const distance = Math.hypot(position.x - this.from.x, position.y - this.from.y)
      if (distance > this.closeThreshold) {
        this.server.sendEventTo('broadcast', {
          name: 'MAIN->OVERLAY::hide-exclusive-widget',
          payload: undefined
        })
        this.removeListeners()
      }
    } else if (isPointInsideRect(position, this.area)) {
      this.overlay.assertOverlayActive()
    } else if (this.overlay.isInteractable) {
      this.removeListeners()
      this.overlay.assertGameActive()
    }
  }

  private readonly handleMouseDown = (e: UiohookMouseEvent) => {
    if (isPointInsideRect(e, this.area)) {
      this.removeListeners()
      this.overlay.assertOverlayActive()
    }
  }
}

function isPointInsideRect (point: Point, rect: Rectangle) {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.width &&
    point.y > rect.y &&
    point.y < rect.y + rect.height
  )
}
