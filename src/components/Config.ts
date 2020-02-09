import Vue from 'vue'
import { MainProcess } from './main-process-bindings'
import { Config as ConfigType } from '@/shared/types'

class ConfigService {
  store: ConfigType

  constructor () {
    this.store = Vue.observable(MainProcess.getConfig())
  }
}

export const Config = new ConfigService()
