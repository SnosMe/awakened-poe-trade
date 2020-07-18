import { protocol, app, ipcMain } from 'electron'
import { IMPORT_FILE } from '@/ipc/ipc-event'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

export function createFileProtocol () {
  protocol.registerFileProtocol('app-file', (req, resp) => {
    resp({ path: path.join(app.getPath('userData'), 'apt-data/files', req.url.substr('app-file://'.length)) })
  })

  ipcMain.on(IMPORT_FILE, (e, filePath: string) => {
    const file = fs.readFileSync(filePath)
    const hash = crypto.createHash('md5').update(file).digest('hex')
    const filename = `${hash}${path.extname(filePath)}`

    fs.mkdirSync(path.join(app.getPath('userData'), 'apt-data/files'), { recursive: true })
    fs.writeFileSync(path.join(app.getPath('userData'), 'apt-data/files', filename), file)

    e.returnValue = `app-file://${filename}`
  })
}
