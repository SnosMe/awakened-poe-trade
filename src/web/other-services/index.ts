import { MainProcess } from '@/ipc/main-process-bindings'
import * as ipc from '@/ipc/ipc-event'
import { openWiki } from './wiki'

export function registerOtherServices () {
  MainProcess.addEventListener(ipc.OPEN_WIKI, (e) => {
    openWiki((e as CustomEvent<string>).detail)
  })
}
