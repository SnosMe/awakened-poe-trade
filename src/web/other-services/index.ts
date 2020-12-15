import { MainProcess } from '@/ipc/main-process-bindings'
import * as ipc from '@/ipc/ipc-event'
import { openWiki } from './wiki'
import { openCOE } from './craft-of-exile'
import { handleLine } from '../client-log/client-log'

export function registerOtherServices () {
  MainProcess.addEventListener(ipc.OPEN_WIKI, (e) => {
    openWiki((e as CustomEvent<string>).detail)
  })

  MainProcess.addEventListener(ipc.CLIENT_LOG_UPDATE, (e) => {
    handleLine((e as CustomEvent<string>).detail)
  })

  MainProcess.addEventListener(ipc.OPEN_COE, (e) => {
    openCOE((e as CustomEvent<string>).detail)
  })
}
