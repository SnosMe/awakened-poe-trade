import fs from 'fs/promises'
import path from 'path'
import ini from 'ini'
import { app } from 'electron'
import process from 'process';
import { hotkeyToString, CodeToKey } from '../../../ipc/KeyToCode'
import type { Logger } from '../RemoteLogger'
import type { ServerEvents } from '../server'

export class GameConfig {
  private filePath: string | null = null

  private _showModsKey: string = 'Alt'
  get showModsKey () { return this._showModsKey }

  constructor (
    private server: ServerEvents,
    private logger: Logger
  ) {}

  async readConfig (filePath: string | null) {
    if (this.filePath === filePath) return

    if (!filePath) {
      if (process.platform === 'darwin') {
        filePath = path.join(app.getPath('appData'), 'Path of Exile', 'Preferences', 'production_Config.ini')
      } else {
        filePath = path.join(app.getPath('documents'), 'My Games', 'Path of Exile', 'production_Config.ini')
      }

      try {
        await fs.access(filePath)
        // this.server.sendEventTo('any', {
        //   name: 'MAIN->CLIENT::file-path-changed',
        //   payload: { file: 'game-config', path: filePath }
        // })
      } catch {
        this.logger.write('error [GameConfig] Failed to find game configuration file in the default location.')
        return
      }
    }

    try {
      let contents = await fs.readFile(filePath, { encoding: 'utf-8', flag: 'r' })
      contents = contents.trimStart() // remove BOM
      const parsed = ini.parse(contents)

      this._showModsKey = this.parseConfigHotkey(
        parsed['ACTION_KEYS']?.['show_advanced_item_descriptions']) ?? 'Alt'

      this.filePath = filePath
    } catch {
      this.logger.write('error [GameConfig] Failed to read game configuration file.')
    }
  }

  private parseConfigHotkey (cfgKey?: string): string | null {
    if (!cfgKey) return null

    const [keyMain, keyMod] = cfgKey.split(' ')

    let key1: string
    if (CodeToKey[keyMain]) {
      key1 = CodeToKey[keyMain]
    } else {
      this.logger.write(`error [GameConfig] Failed to read key: ${cfgKey}.`)
      return null
    }

    let key2: string | undefined
    if (keyMod) {
      if (keyMod === '1') {
        key2 = 'Shift'
      } else if (keyMod === '2') {
        key2 = 'Ctrl'
      } else if (keyMod === '3') {
        key2 = 'Alt'
      } else {
        this.logger.write(`error [GameConfig] Failed to read modifier key: ${cfgKey}.`)
        return null
      }
    }

    return hotkeyToString(
      [key1],
      key2 === 'Ctrl',
      key2 === 'Shift',
      key2 === 'Alt'
    )
  }
}
