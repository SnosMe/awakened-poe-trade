import { promises as fs, watchFile, unwatchFile } from 'fs'
import { app } from 'electron';
import { ServerEvents } from '../server'
import { Logger } from '../RemoteLogger'

export class GameLogWatcher {
  private offset = 0
  private filePath?: string
  private file?: fs.FileHandle
  private isReading = false
  private readBuff = Buffer.allocUnsafe(64 * 1024)

  constructor (
    private server: ServerEvents,
    private logger: Logger,
  ) {}

  async restart (logFile: string | null) {
    if (this.filePath === logFile) return

    if (!logFile) {
      let possiblePaths: string[] = []
      if (process.platform === 'win32') {
        possiblePaths = [
          'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs\\Client.txt',
          'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs\\Client.txt'
        ]
      } else if (process.platform === 'darwin') {
        possiblePaths = [
          `${app.getPath('home')}/Library/Caches/com.GGG.PathOfExile/Logs/Client.txt`
        ]
      }

      for (const filePath of possiblePaths) {
        try {
          await fs.access(filePath)
          // this.server.sendEventTo('any', {
          //   name: 'MAIN->CLIENT::file-path-changed',
          //   payload: { file: 'game-log', path: filePath }
          // })
          logFile = filePath
          break
        } catch {}
      }
    }

    if (logFile) {
      try {
        await this.watch(logFile)
      } catch {
        this.logger.write('error [GameLogWatcher] Failed to watch file.')
      }
    }
  }

  private async watch (path: string) {
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

  private handleFileChange () {
    if (!this.isReading) {
      this.isReading = true
      this.readToEOF()
    }
  }

  private async readToEOF () {
    if (!this.file) {
      this.isReading = false
      return
    }

    const { bytesRead } = await this.file.read(this.readBuff, 0, this.readBuff.length, this.offset)

    if (bytesRead) {
      const str = this.readBuff.toString('utf8', 0, bytesRead)
      const lines = str.split('\n').map(line => line.trim()).filter(line => line.length)
      this.server.sendEventTo('broadcast', {
        name: 'MAIN->CLIENT::game-log',
        payload: { lines }
      })
    }

    if (bytesRead) {
      this.offset += bytesRead
      this.readToEOF()
    } else {
      this.isReading = false
    }
  }
}
