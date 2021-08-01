import fs from 'fs'
import path from 'path'
import ini from 'ini'
import { app } from 'electron'
import { config as appConfig } from './config'
import { logger } from './logger'
import { hotkeyToString, CodeToKey } from '@/ipc/KeyToCode'

export interface GameConfig {
  highlightKey: string | null
}

export let gameConfig: GameConfig | null = null
export function loadAndCache () {
  gameConfig = readConfig()
  return gameConfig
}

export function readConfig (): GameConfig | null {
  let filePath = appConfig.get('gameConfig')

  if (!filePath) {
    filePath = path.join(app.getPath('documents'), 'My Games', 'Path of Exile', 'production_Config.ini')
    try {
      fs.accessSync(filePath)
      appConfig.set('gameConfig', filePath)
    } catch {
      return null
    }
  }

  try {
    let contents = fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' })
    contents = contents.trimStart() // remove BOM
    const parsed = ini.parse(contents)

    return {
      highlightKey: parseConfigHotkey(parsed.ACTION_KEYS?.highlight || '')
    }
  } catch {
    logger.error('Failed to read file', { source: 'game-config', file: filePath })
    return null
  }
}

function parseConfigHotkey (cgfKey: string): string | null {
  const [keyMain, keyMod] = cgfKey.split(' ')

  let key1: string
  if (CodeToKey[keyMain]) {
    key1 = CodeToKey[keyMain]
  } else {
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
