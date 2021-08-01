import { promises as fs, watchFile, unwatchFile } from 'fs'
import { overlayWindow } from './overlay-window'
import * as ipc from '@/ipc/ipc-event'
import { config } from './config'
import { logger } from './logger'

const COMMON_PATH = [
  'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs\\Client.txt',
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs\\Client.txt'
]

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LogWatcher {
  static offset = 0
  static filePath?: string
  static file?: fs.FileHandle
  static isReading = false
  static readBuff = Buffer.allocUnsafe(64 * 1024)

  static async start () {
    let logFile = config.get('clientLog')

    if (!logFile && process.platform === 'win32') {
      for (const filePath of COMMON_PATH) {
        try {
          await fs.access(filePath)
          config.set('clientLog', filePath)
          logFile = filePath
          break
        } catch {}
      }
    }

    if (logFile) {
      try {
        await LogWatcher.watch(logFile)
      } catch {
        logger.error('Failed to watch', { source: 'log-watcher', file: logFile })
      }
    }
  }

  static async watch (path: string) {
    if (this.file) {
      unwatchFile(this.filePath!)
      await this.file.close()
      this.file = undefined
      this.isReading = false
    }

    watchFile(path, { interval: 450 }, () => {
      this.handleFileChange()
    })
    this.filePath = path

    this.file = await fs.open(path, 'r')
    const stats = await this.file.stat()
    this.offset = stats.size
  }

  static handleFileChange () {
    if (!this.isReading) {
      this.isReading = true
      this.readToEOF()
    }
  }

  static async readToEOF () {
    if (!this.file) {
      this.isReading = false
      return
    }

    const { bytesRead } = await this.file.read(this.readBuff, 0, this.readBuff.length, this.offset)

    if (bytesRead) {
      const str = this.readBuff.toString('utf8', 0, bytesRead)
      const lines = str.split('\n').map(line => line.trim()).filter(line => line.length)
      overlayWindow!.webContents.send(ipc.CLIENT_LOG_UPDATE, { lines } as ipc.IpcClientLog)
    }

    if (bytesRead) {
      this.offset += bytesRead
      this.readToEOF()
    } else {
      this.isReading = false
    }
  }
}
