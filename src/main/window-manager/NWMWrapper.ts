import { windowManager, Window } from 'node-window-manager'
import { IWindowManager } from './WindowManager'
import { Rectangle } from 'electron'

export class NWMWrapper implements IWindowManager {
  static async createManager () {
    if (process.platform === 'darwin') {
      windowManager.requestAccessibility()
    }

    return new NWMWrapper()
  }

  async getActiveWindowTitle () {
    const window = windowManager.getActiveWindow()
    if (!window) return null

    return window.getTitle()
  }

  async getActiveWindowId () {
    const window = windowManager.getActiveWindow()
    if (!window) return null

    return window.id
  }

  async focusWindowById (id: number) {
    new Window(id).bringToTop()
  }

  async getActiveWindowContentBounds () {
    const window = windowManager.getActiveWindow()
    if (!window) return null

    return window.getBounds() as Rectangle
  }
}
