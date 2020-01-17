import { Rectangle } from 'electron'

export interface IWindowManager {
  getActiveWindowTitle (): Promise<string | null>
  getActiveWindowContentBounds (): Promise<Rectangle | null>
}

export class WindowManager implements IWindowManager {
  private impl!: IWindowManager

  static async createManager () {
    const manager = new WindowManager()

    if (process.platform === 'win32' || process.platform === 'darwin') {
      const { NWMWrapper } = require('./NWMWrapper')
      manager.impl = await NWMWrapper.createManager()
    } else {
      const { LinuxX11 } = require('./LinuxX11')
      manager.impl = await LinuxX11.createManager()
    }

    return manager
  }

  getActiveWindowTitle () {
    return this.impl.getActiveWindowTitle()
  }

  getActiveWindowContentBounds () {
    return this.impl.getActiveWindowContentBounds()
  }
}
