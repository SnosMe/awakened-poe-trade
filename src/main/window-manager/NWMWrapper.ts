import { windowManager } from 'node-window-manager'
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

  async getActiveWindowBounds () {
    const window = windowManager.getActiveWindow()
    if (!window) return null

    const pos = window.getBounds() as Rectangle

    if (process.platform === 'win32') {
      // Interesting fact:
      //   some windows have `1px border` in focused state,
      //   so it would be 7px for them, but not PoE window
      const WINDOW_OFFSET = 8

      const isWindowedFullscreen = (pos.y === 0)
      const isMaximized = !isWindowedFullscreen && (pos.y === -WINDOW_OFFSET)

      if (!isWindowedFullscreen) {
        pos.x += WINDOW_OFFSET
        pos.width! -= WINDOW_OFFSET * 2

        if (isMaximized) {
          pos.y += WINDOW_OFFSET
          pos.height -= WINDOW_OFFSET * 2
        } else {
          pos.height -= WINDOW_OFFSET
        }
      }

      // step 2 - remove title space. 32px taken on Windows 10. Also DPI may apply?
      if (!isWindowedFullscreen) {
        if (isMaximized) {
          pos.y += (32 - WINDOW_OFFSET)
          pos.height -= (32 - WINDOW_OFFSET)
        } else {
          pos.y += 32
          pos.height -= 32
        }
      }
    }

    return pos
  }
}
