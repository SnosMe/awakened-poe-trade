import { reactive } from 'vue'
import { MainProcess } from '@/ipc/main-process-bindings'
import type { Config as ConfigType } from '@/ipc/types'
import type { GameConfig } from '@/main/game-config'
import { PUSH_CONFIG } from '@/ipc/ipc-event'

class ConfigService {
  store: ConfigType
  gameConfig: GameConfig | null

  constructor () {
    const configs = MainProcess.getConfig()
    this.store = reactive(configs.app)
    this.gameConfig = configs.game

    MainProcess.addEventListener(PUSH_CONFIG, (e) => {
      const config = (e as CustomEvent<ConfigType>).detail
      Object.assign(this.store, config)
    })
  }

  saveConfig () {
    MainProcess.saveConfig(JSON.parse(JSON.stringify(this.store)))
  }
}

export const Config = new ConfigService()
