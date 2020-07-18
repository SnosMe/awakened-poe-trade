import { MainProcess } from '@/ipc/main-process-bindings'
import * as ipc from '@/ipc/ipc-event'
import { openWiki } from './wiki'
import { openTrade } from './trade'

export function registerOtherServices () {
  MainProcess.addEventListener(ipc.OPEN_WIKI, (e) => {
    openWiki((e as CustomEvent<string>).detail)
  })

  MainProcess.addEventListener(ipc.OPEN_TRADE, (e) => {
    openTrade((e as CustomEvent<string>).detail)
  })
}
